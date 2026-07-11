/**
 * COS SDK 业务适配层：不改官方方法逻辑，仅补充临时凭证、用户目录、默认参数、空输入保护和失败清理。
 */
import COS from 'cos-js-sdk-v5'
import { createCosCredential } from '@/api'

/** 创建附带当前用户凭证信息的 COS 客户端 */
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

/** 批量删除对象并返回官方结果；空列表不创建客户端 */
export const deleteCosFiles = async (
  params: Partial<COS.DeleteMultipleObjectParams>,
  options: {
    /** 已创建的 COS 客户端；不传时自动创建 */
    client?: Awaited<ReturnType<typeof createCosClient>>
  } = {},
) => {
  if (!params.Objects?.length) return

  const client = options.client ?? (await createCosClient())
  return client.deleteMultipleObject({
    Quiet: true,
    Bucket: client.bucket,
    Region: client.region,
    Objects: params.Objects,
    ...params,
  })
}

/** 上传文件并返回官方结果；失败时清理本批对象，空列表不创建客户端 */
export const uploadCosFiles = async (
  params: Omit<Partial<COS.UploadFilesParams>, 'files'> & {
    /** 待上传文件；Key 为当前用户目录下的相对路径 */
    files?: (Partial<COS.UploadFilesParams['files'][number]> &
      Pick<COS.UploadFilesParams['files'][number], 'Body' | 'Key'>)[]
  } = {},
  options: {
    /** 已创建的 COS 客户端；不传时自动创建 */
    client?: Awaited<ReturnType<typeof createCosClient>>
  } = {},
) => {
  const { files, ...uploadOptions } = params
  if (!files?.length) return { files: [] }

  const client = options.client ?? (await createCosClient())

  const objects = files.map((item) => ({
    Bucket: client.bucket,
    Region: client.region,
    ...item,
    Key: `${client.prefix}${item.Key}`,
  }))
  const result = await client
    .uploadFiles({ files: objects, ...uploadOptions })
    .catch(async (error) => {
      await deleteCosFiles({ Objects: objects }, { client }).catch(
        () => undefined,
      )
      throw error
    })
  const error = result.files.find((item) => item.error)?.error
  if (error) {
    await deleteCosFiles({ Objects: objects }, { client }).catch(
      () => undefined,
    )
    throw error
  }

  return result
}
