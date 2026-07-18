<!--
文件编辑器：
- 默认 model 维护本轮新增的本地文件，具名 files model 可选传入带 url 的既有资源。
- 新旧文件合并交给 ElUpload 展示和删除，操作后自动同步拆回各自 model。
- 仅维护编辑状态，不负责上传文件或删除远端资源。
-->
<script lang="ts">
import { toResourceUrl } from '@/composables/cos'
import type { UploadUserFile } from 'element-plus'

/** 可适配为上传列表项的既有资源 */
export interface FileResource {
  /** 资源 URL 或 COS object key */
  url: string
  /** 优先用于列表展示的轻量预览资源 */
  previewUrl?: string
}

/**
 * 创建供 `ElUpload` 使用的统一可写文件列表。
 * 读取时将既有资源适配为成功状态的展示项，并与本地新增文件合并；
 * 写入时通过业务字段 `_origin` 将列表同步拆回两个 model。
 * @returns 可直接绑定 `ElUpload` file-list 的可写计算属性
 */
export const computedFileList = <T extends FileResource>(
  /** 既有资源，展示地址优先使用 `previewUrl` */
  files: Ref<T[]>,
  /** 本轮新增的本地文件 */
  fileList: Ref<UploadUserFile[]>,
) =>
  computed<(UploadUserFile & { _origin?: T })[]>({
    get: () => [
      ...files.value.map((item) => ({
        name: item.url,
        url: toResourceUrl(item.previewUrl ?? item.url),
        status: 'success' as const,
        _origin: item,
      })),
      ...fileList.value,
    ],
    set: (list) => {
      files.value = list.flatMap((item) => (item._origin ? [item._origin] : []))
      fileList.value = list.filter((item) => !item._origin)
    },
  })
</script>

<script lang="ts" setup generic="T extends FileResource">
import { Plus } from '@element-plus/icons-vue'

/** 本轮新增的本地文件；调用方可从 `raw` 拿原始 File 交给后续流程 */
const fileList = defineModel<UploadUserFile[]>({ required: true })

/** 编辑前就存在的既有资源；用户点删除会直接从这里剔除 */
const files = defineModel<T[]>('files', { default: () => [] })

const _fileList = computedFileList(files, fileList)
</script>

<template>
  <ElUpload
    v-model:file-list="_fileList"
    class="EditorFiles"
    multiple
    :auto-upload="false"
  >
    <ElButton :icon="Plus">添加文件</ElButton>
  </ElUpload>
</template>

<style lang="scss" scoped>
.EditorFiles {
  display: flex;
  flex-direction: column;
  gap: 4px;

  :deep(.el-upload) {
    align-self: flex-start;
  }

  :deep(.el-upload-list) {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;

    > .el-upload-list__item {
      margin: 0;
    }
  }
}
</style>
