import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

const secretKey = process.env.SecretKey;
if (!secretKey) throw new Error('缺少 SecretKey 环境变量');

// HKDF 把项目唯一 SecretKey 固定派生为 AES-256 所需的 32 字节。
const encryptionKey = Buffer.from(
  hkdfSync('sha256', secretKey, '', 'mylog3:encryption', 32),
);

/**
 * 使用项目对称密钥加密文本，并封装解密所需的随机 IV 与认证标签。
 * @returns Base64URL 编码的密文凭证
 */
export const encrypt = (plaintext: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv, {
    authTagLength: 16,
  });
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    'base64url',
  );
};

/**
 * 解密由 encrypt 生成的凭证，并校验内容未被篡改。
 * @returns 原始明文；凭证格式错误、密钥不匹配或内容被篡改时抛出异常
 */
export const decrypt = (token: string): string => {
  // token 布局固定为 12 字节 IV + 16 字节 authTag + 至少 1 字节密文。
  const payload = Buffer.from(token, 'base64url');
  if (payload.length <= 28) throw new Error('加密凭证长度错误');

  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey,
    payload.subarray(0, 12),
    { authTagLength: 16 },
  );
  decipher.setAuthTag(payload.subarray(12, 28));
  return Buffer.concat([
    decipher.update(payload.subarray(28)),
    decipher.final(),
  ]).toString('utf8');
};
