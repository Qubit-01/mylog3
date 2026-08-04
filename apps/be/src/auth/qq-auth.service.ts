import {
  BadGatewayException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

/** QQ 互联公开应用 ID */
const QQ_APP_ID = '102099147';

@Injectable()
export class QqAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** 使用 QQ 身份查找已绑定账号并返回本站 JWT */
  async login(accessToken: string): Promise<string> {
    const unionid = await this.getUnionid(accessToken);
    const auth = await this.prisma.auth.findUnique({
      where: { unionidQq: unionid },
    });
    if (!auth) {
      throw new NotFoundException('该 QQ 尚未绑定本站账号');
    }

    // Auth 可关联多个用户档案；第三方登录默认进入最早创建的主档案。
    const user = await this.prisma.user.findFirst({
      where: { authId: auth.id },
      orderBy: { id: 'asc' },
    });
    if (!user) {
      throw new InternalServerErrorException('QQ 绑定账号缺少用户档案');
    }
    return this.jwt.signAsync({ sub: user.id });
  }

  /** 验证 QQ 登录态并绑定到当前登录用户所属的 Auth */
  async bind(userId: number, accessToken: string): Promise<void> {
    const unionid = await this.getUnionid(accessToken);
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

  /** 验证 QQ Access Token 并返回可信 UnionID */
  private async getUnionid(accessToken: string): Promise<string> {
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
    if (identity.client_id !== QQ_APP_ID) {
      throw new UnauthorizedException('QQ 用户身份与本站应用不匹配');
    }
    if (!identity.unionid) {
      throw new BadGatewayException(
        'QQ 未返回 UnionID，请先在 QQ 互联平台开通 UnionID',
      );
    }
    return identity.unionid;
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
