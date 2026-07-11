/**
 * COS SDK 业务适配层：不改官方方法逻辑，仅补充临时凭证、用户目录、默认参数、空输入保护和失败清理。
 */
import COS from 'cos-js-sdk-v5'
import { createCosCredential } from '@/api'

/** 创建附带当前用户凭证信息的 COS 客户端，仅供当前适配层使用 */
const createCosClient = async () => {
  const credential = await createCosCredential()
  return Object.assign(
    new COS({
      SecretId: credential.credentials.tmpSecretId,
      SecretKey: credential.credentials.tmpSecretKey,
      SecurityToken: credential.credentials.sessionToken,
      StartTime: credential.startTime,
      ExpiredTime: credential.expiredTime,
    }),
    credential,
  )
}

/** 批量删除完整 object key；空列表不创建客户端 */
export const deleteCosFiles = async (keys: string[]) => {
  if (!keys.length) return

  const client = await createCosClient()
  return client.deleteMultipleObject({
    Quiet: true,
    Bucket: client.bucket,
    Region: client.region,
    Objects: keys.map((Key) => ({ Key })),
  })
}

/** 上传项：Key 是当前用户目录下的相对路径，Body 是浏览器 File 等 SDK 支持的文件体 */
export type CosUploadFile = Pick<
  COS.UploadFilesParams['files'][number],
  'Body' | 'Key'
>

/**
 * 批量上传文件并返回对应的完整 object key。
 * 任一文件失败时会尽力删除本批全部对象，避免留下孤儿文件。
 * @param files 待上传文件列表
 * @param onProgress 全部文件的整体上传进度回调
 */
export const uploadCosFiles = async (
  files: CosUploadFile[],
  onProgress?: COS.UploadFilesParams['onProgress'],
) => {
  if (!files.length) return []

  const client = await createCosClient()
  const objects = files.map((file) => ({
    Bucket: client.bucket,
    Region: client.region,
    ...file,
    Key: `${client.prefix}${file.Key}`,
  }))
  const rollback = () =>
    client
      .deleteMultipleObject({
        Quiet: true,
        Bucket: client.bucket,
        Region: client.region,
        Objects: objects.map(({ Key }) => ({ Key })),
      })
      .catch(() => undefined)

  const result = await client
    .uploadFiles({ files: objects, onProgress })
    .catch(async (error) => {
      await rollback()
      throw error
    })
  const error = result.files.find((file) => file.error)?.error
  if (error) {
    await rollback()
    throw error
  }

  return objects.map(({ Key }) => Key)
}
