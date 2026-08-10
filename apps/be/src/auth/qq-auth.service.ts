import { randomUUID } from 'node:crypto';
import {
  BadGatewayException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

/** QQ 互联公开应用 ID */
const QQ_CLIENT_ID = '102099147';
/** QQ 互联平台登记的固定回调地址 */
const QQ_REDIRECT_URI = 'https://mylog.ink/sign-in-qq';

/** 发起 QQ OAuth 时写入短期 Cookie 的可信状态 */
interface QqState {
  type: 'qq-state';
  state: string;
  redirect: string;
}

/** QQ Access Token 对应的可信身份 */
interface QqIdentity {
  openid: string;
  unionid: string;
}

/** QQ 用户资料接口的原始响应字段 */
interface QqProfileResponse {
  ret?: number;
  msg?: string;
  nickname?: string;
  figureurl_qq_1?: string;
  figureurl_qq_2?: string;
}

/** 经 QQ 服务端验证后，可安全展示或用于创建账号的用户资料 */
interface QqProfile {
  nickname: string;
  avatar: string | null;
}

/** QQ 授权完成后等待注册或绑定的可信身份 */
interface QqPending extends QqProfile {
  type: 'qq-pending';
  unionid: string;
  redirect: string;
}

/** QQ Code 换取 Access Token 的响应 */
interface QqTokenResponse {
  access_token?: string;
  error?: number;
  error_description?: string;
}

/** QQ 回调处理结果；token 存在表示已完成本站登录 */
interface QqCallbackResult {
  redirect: string;
  profile: QqProfile | null;
  token?: string;
  pendingToken?: string;
}

@Injectable()
export class QqAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** 创建短期可信状态并返回 QQ Authorization Code 授权地址 */
  async start(redirect = '/'): Promise<{ url: string; stateToken: string }> {
    const state = randomUUID();
    const stateToken = await this.jwt.signAsync<QqState>(
      { type: 'qq-state', state, redirect: this.normalizeRedirect(redirect) },
      { expiresIn: '10m' },
    );
    const url = new URL('https://graph.qq.com/oauth2.0/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', QQ_CLIENT_ID);
    url.searchParams.set('redirect_uri', QQ_REDIRECT_URI);
    url.searchParams.set('state', state);
    return { url: url.href, stateToken };
  }

  /** 校验回调并完成 QQ 登录；未绑定时签发短期待处理身份 */
  async callback(
    code: string | undefined,
    state: string | undefined,
    oauthToken: string | undefined,
  ): Promise<QqCallbackResult> {
    const oauth = await this.verifyOAuth(oauthToken);

    // 1. Code 已消费后的刷新直接恢复待处理身份。
    if (oauth.type === 'qq-pending') {
      return {
        redirect: oauth.redirect,
        profile: { nickname: oauth.nickname, avatar: oauth.avatar },
      };
    }

    // 2. Cookie 与 QQ 原样返回的 state 必须属于同一次授权请求。
    if (!code || !state || state !== oauth.state) {
      throw new UnauthorizedException('QQ 登录请求已失效，请返回重试');
    }

    // 3. Access Token 仅在后端使用，前端资料不参与账号创建。
    const accessToken = await this.exchangeCode(code);
    const { openid, unionid } = await this.getIdentity(accessToken);
    const userId = await this.findPrimaryUserId(unionid);
    if (userId) {
      return {
        redirect: oauth.redirect,
        profile: null,
        token: await this.jwt.signAsync({ sub: userId }),
      };
    }

    const profile = await this.getProfile(accessToken, openid);
    return {
      redirect: oauth.redirect,
      profile,
      pendingToken: await this.jwt.signAsync<QqPending>(
        {
          type: 'qq-pending',
          unionid,
          redirect: oauth.redirect,
          ...profile,
        },
        { expiresIn: '10m' },
      ),
    };
  }

  /** 确认以当前 QQ 注册；并发下已完成注册时直接登录已有账号 */
  async signUp(pendingToken: string | undefined): Promise<string> {
    const pending = await this.verifyPending(pendingToken);
    const userId = await this.findPrimaryUserId(pending.unionid);
    if (userId) return this.jwt.signAsync({ sub: userId });

    // 1. 用户明确选择注册后才创建账号；昵称冲突时第二次尝试自动添加短后缀。
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const name =
        attempt === 0
          ? pending.nickname
          : `${pending.nickname}_${randomUUID().slice(0, 6)}`;
      try {
        const user = await this.prisma.$transaction(async (tx) => {
          const createdAuth = await tx.auth.create({
            data: { pswd: null, unionidQq: pending.unionid },
          });
          return tx.user.create({
            data: {
              authId: createdAuth.id,
              name,
              avatar: pending.avatar,
              data: {},
              settings: {},
            },
          });
        });
        return this.jwt.signAsync({ sub: user.id });
      } catch (e) {
        if ((e as { code?: string }).code !== 'P2002') throw e;

        // 1.1 同一 QQ 并发注册时，使用已经创建完成的账号登录。
        const existingUserId = await this.findPrimaryUserId(pending.unionid);
        if (existingUserId) return this.jwt.signAsync({ sub: existingUserId });
      }
    }

    throw new ConflictException('QQ 昵称生成冲突，请重试');
  }

  /** 将待处理的 QQ 身份绑定到当前登录用户所属的 Auth */
  async bind(userId: number, pendingToken: string | undefined): Promise<void> {
    const { unionid } = await this.verifyPending(pendingToken);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('当前账号不存在');

    try {
      // 条件更新避免并发绑定覆盖当前账号已有的 QQ 身份。
      const updated = await this.prisma.auth.updateMany({
        where: {
          id: user.authId,
          OR: [{ unionidQq: null }, { unionidQq: unionid }],
        },
        data: { unionidQq: unionid },
      });
      if (updated.count !== 1) {
        throw new ConflictException('当前账号已绑定其他 QQ');
      }
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException('该 QQ 已绑定其他账号');
      }
      throw e;
    }
  }

  /** 校验 QQ OAuth 临时 Cookie，并读取当前流程阶段 */
  private async verifyOAuth(
    token: string | undefined,
  ): Promise<QqState | QqPending> {
    if (!token)
      throw new UnauthorizedException('QQ 登录请求已失效，请返回重试');
    try {
      const oauth = await this.jwt.verifyAsync<QqState | QqPending>(token);
      if (typeof oauth.redirect !== 'string') throw new Error();
      if (oauth.type === 'qq-state' && typeof oauth.state === 'string') {
        return oauth;
      }
      if (
        oauth.type === 'qq-pending' &&
        typeof oauth.unionid === 'string' &&
        typeof oauth.nickname === 'string' &&
        (oauth.avatar === null || typeof oauth.avatar === 'string')
      ) {
        return oauth;
      }
      throw new Error();
    } catch {
      throw new UnauthorizedException('QQ 登录请求已失效，请返回重试');
    }
  }

  /** 校验当前 QQ OAuth 流程正等待注册或绑定 */
  private async verifyPending(token: string | undefined): Promise<QqPending> {
    const oauth = await this.verifyOAuth(token);
    if (oauth.type !== 'qq-pending') {
      throw new UnauthorizedException('QQ 登录请求已失效，请返回重试');
    }
    return oauth;
  }

  /** 只允许登录完成后回到本站内部地址 */
  private normalizeRedirect(redirect: string): string {
    try {
      const url = new URL(redirect, QQ_REDIRECT_URI);
      return redirect.startsWith('/') &&
        url.origin === new URL(QQ_REDIRECT_URI).origin
        ? `${url.pathname}${url.search}${url.hash}`
        : '/';
    } catch {
      return '/';
    }
  }

  /** 使用一次性 Authorization Code 换取仅后端持有的 Access Token */
  private async exchangeCode(code: string): Promise<string> {
    const clientSecret = process.env.QQ_APP_KEY;
    if (!clientSecret) {
      throw new InternalServerErrorException('QQ 登录服务未配置');
    }
    const tokenUrl = new URL('https://graph.qq.com/oauth2.0/token');
    tokenUrl.searchParams.set('grant_type', 'authorization_code');
    tokenUrl.searchParams.set('client_id', QQ_CLIENT_ID);
    tokenUrl.searchParams.set('client_secret', clientSecret);
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('redirect_uri', QQ_REDIRECT_URI);
    tokenUrl.searchParams.set('fmt', 'json');
    const token = await this.requestQq<QqTokenResponse>(tokenUrl);
    if (token.error || !token.access_token) {
      throw new UnauthorizedException(
        token.error_description || 'QQ 授权码无效或已过期，请重新登录',
      );
    }
    return token.access_token;
  }

  /** 查找 QQ 已绑定 Auth 下最早创建的用户档案 */
  private async findPrimaryUserId(unionid: string): Promise<number | null> {
    const auth = await this.prisma.auth.findUnique({
      where: { unionidQq: unionid },
    });
    if (!auth) return null;

    const user = await this.prisma.user.findFirst({
      where: { authId: auth.id },
      orderBy: { id: 'asc' },
    });
    if (!user) {
      throw new InternalServerErrorException('QQ 绑定账号缺少用户档案');
    }
    return user.id;
  }

  /** 验证 QQ Access Token 并返回可信 OpenID 与 UnionID */
  private async getIdentity(accessToken: string): Promise<QqIdentity> {
    const identityUrl = new URL('https://graph.qq.com/oauth2.0/me');
    identityUrl.searchParams.set('access_token', accessToken);
    identityUrl.searchParams.set('unionid', '1');
    identityUrl.searchParams.set('fmt', 'json');
    const identity = await this.requestQq<{
      client_id?: string;
      openid?: string;
      unionid?: string;
      error?: number;
      error_description?: string;
    }>(identityUrl);
    if (identity.error || !identity.openid) {
      throw new UnauthorizedException(
        identity.error_description || 'QQ 登录状态无效，请重新登录',
      );
    }
    if (identity.client_id !== QQ_CLIENT_ID) {
      throw new UnauthorizedException('QQ 用户身份与本站应用不匹配');
    }
    if (!identity.unionid) {
      throw new BadGatewayException(
        'QQ 未返回 UnionID，请先在 QQ 互联平台开通 UnionID',
      );
    }
    return { openid: identity.openid, unionid: identity.unionid };
  }

  /** 使用已验证的 QQ 身份读取用于展示或创建账号的昵称和头像 */
  private async getProfile(
    accessToken: string,
    openid: string,
  ): Promise<QqProfile> {
    const profileUrl = new URL('https://graph.qq.com/user/get_user_info');
    profileUrl.searchParams.set('access_token', accessToken);
    profileUrl.searchParams.set('oauth_consumer_key', QQ_CLIENT_ID);
    profileUrl.searchParams.set('openid', openid);
    const profile = await this.requestQq<QqProfileResponse>(profileUrl);
    if (profile.ret !== 0) {
      throw new BadGatewayException(
        profile.msg || 'QQ 用户信息获取失败，请重新登录',
      );
    }
    const nickname =
      typeof profile.nickname === 'string' ? profile.nickname.trim() : '';
    const avatar =
      (typeof profile.figureurl_qq_2 === 'string'
        ? profile.figureurl_qq_2
        : typeof profile.figureurl_qq_1 === 'string'
          ? profile.figureurl_qq_1
          : null
      )?.replace(/^http:/, 'https:') ?? null;
    return { nickname: nickname || 'QQ用户', avatar };
  }

  /** 调用 QQ 身份接口并统一处理网络、HTTP 与 JSON 异常 */
  private async requestQq<T extends object>(url: URL): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        throw new BadGatewayException('QQ 服务返回异常状态');
      }
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new BadGatewayException('QQ 服务返回异常数据');
      }
      return data as T;
    } catch (e) {
      if (e instanceof BadGatewayException) throw e;
      throw new BadGatewayException('QQ 服务暂时不可用');
    }
  }
}
