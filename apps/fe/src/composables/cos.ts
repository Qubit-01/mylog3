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

/** 收集资源占用的 COS object key，跳过外链 */
export const collectCosKeys = (
  ...groups: ({ url: string; previewUrl?: string }[] | undefined)[]
) =>
  groups
    .flatMap((items) => items ?? [])
    .flatMap(({ url, previewUrl }) => (previewUrl ? [url, previewUrl] : [url]))
    .filter((key) => !URL.canParse(key))

/**
 * 分页统计当前用户目录的对象数量与总大小。
 * @returns objectCount 为对象数量，totalBytes 为对象总字节数
 */
export const getCosUsage = async () => {
  const client = await createCosClient()
  let marker: string | undefined
  let objectCount = 0
  let totalBytes = 0
  let originalBytes = 0
  let previewBytes = 0
  const directories = new Map<
    string,
    { objectCount: number; totalBytes: number }
  >()
  const extensions = new Map<
    string,
    { objectCount: number; totalBytes: number }
  >()

  while (true) {
    const result = await client.getBucket({
      Bucket: client.bucket,
      Region: client.region,
      Prefix: client.prefix,
      Marker: marker,
      MaxKeys: 1000,
    })
    for (const { Key, Size } of result.Contents) {
      const bytes = Number(Size)
      const relativeKey = Key.slice(client.prefix.length)
      const slash = relativeKey.lastIndexOf('/')
      const directory = slash < 0 ? '根目录' : relativeKey.slice(0, slash)
      const extension = relativeKey.match(/\.([^./]+)$/)?.[1]?.toLowerCase()

      objectCount += 1
      totalBytes += bytes
      if (relativeKey.includes('/preview/')) previewBytes += bytes
      else originalBytes += bytes
      for (const [groups, name] of [
        [directories, directory],
        [extensions, extension ?? '无后缀'],
      ] as const) {
        const usage = groups.get(name)
        groups.set(name, {
          objectCount: (usage?.objectCount ?? 0) + 1,
          totalBytes: (usage?.totalBytes ?? 0) + bytes,
        })
      }
    }
    if (result.IsTruncated !== 'true' || !result.NextMarker) break
    marker = result.NextMarker
  }

  return {
    /** 当前用户目录中的对象数量 */
    objectCount,
    /** 当前用户目录中的对象总大小，单位 Byte */
    totalBytes,
    /** 非 preview 目录对象的总大小，单位 Byte */
    originalBytes,
    /** preview 目录对象的总大小，单位 Byte */
    previewBytes,
    /** 按对象所在目录聚合的对象数量与总大小，按空间降序排列 */
    directories: [...directories]
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.totalBytes - a.totalBytes),
    /** 按文件后缀聚合的对象数量与总大小，按空间降序排列 */
    extensions: [...extensions]
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.totalBytes - a.totalBytes),
  }
}

/** 批量删除完整 object key；空列表不创建客户端，任一对象失败时抛出异常 */
export const deleteCosFiles = async (keys: string[]) => {
  if (!keys.length) return

  const client = await createCosClient()
  const result = await client.deleteMultipleObject({
    Quiet: true,
    Bucket: client.bucket,
    Region: client.region,
    Objects: keys.map((Key) => ({ Key })),
  })
  if (result.Error?.length) {
    throw new Error(
      `COS 文件删除失败：${result.Error.map(({ Key, Message }) => `${Key} ${Message ?? ''}`.trim()).join('；')}`,
    )
  }
  return result
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
