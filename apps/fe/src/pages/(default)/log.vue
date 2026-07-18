<script lang="ts" setup>
/** Log 详情：在默认布局内按 query.id 沉浸式展示单条记录 */
import { deleteLog, getLog, type Log } from '@/api'
import { collectCosKeys, deleteCosFiles } from '@/composables/cos'
import { useLogStore } from '@/stores/log'
import { useUserStore } from '@/stores/user'
import { Close, Delete, Edit } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'

definePage({ meta: { title: '详情' } })

const route = useRoute()
const router = useRouter()
const logStore = useLogStore()
const userStore = useUserStore()
const pending = ref(false)
const deleting = ref(false)
/** 是否处于编辑态；编辑器在 article 下方展开，保存成功或点关闭回到只读 */
const editing = ref(false)
/** 当前 query 中的正整数 Log id；格式无效时返回 undefined */
const id = computed(() => {
  const value = Array.isArray(route.query.id)
    ? route.query.id[0]
    : route.query.id
  return value && /^[1-9]\d*$/.test(value) ? Number(value) : undefined
})

/** 当前详情实体；ref 可写以便保存后本地即时刷新，无需重新拉取 */
const log = ref<Log>()

/** 随 query.id 自动加载详情；无效参数或请求失败统一走空状态 */
watch(
  id,
  async (newId) => {
    log.value = undefined
    if (!newId) return
    pending.value = true
    log.value = await getLog({ id: newId }).catch(() => undefined)
    pending.value = false
  },
  { immediate: true },
)

/** 编辑器保存成功：本地刷新展示、退出编辑态 */
const onSaved = (saved: Log) => {
  log.value = saved
  editing.value = false
}

/** 确认后先删除记录，再尽力清理 COS 附件、列表缓存并返回我的 Log */
const onDelete = async () => {
  const target = log.value
  if (!target || deleting.value) return
  deleting.value = true
  try {
    await ElMessageBox.confirm('删除后不可恢复', '确定删除这条记录吗？', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
    })
    await deleteLog({ id: target.id })
    logStore.remove(target.id)
    try {
      await deleteCosFiles(
        collectCosKeys(target.medias, target.audios, target.files),
      )
      ElMessage.success('已删除')
    } catch {
      ElMessage.warning('Log 已删除，但附件清理失败')
    }
    await router.replace('/mine')
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') throw e
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <ElScrollbar
    class="log default-scrollbar"
    wrap-class="wrap"
    view-class="view"
  >
    <ElSkeleton v-if="pending" class="state m-panel" :rows="6" animated />
    <ElEmpty
      v-else-if="!log"
      class="state m-panel"
      description="Log 不存在或无权查看"
    />

    <template v-else>
      <article class="content m-panel">
        <header class="meta">
          <span>#{{ log.userId }}</span>
          <time :datetime="log.logAt">
            {{ dayjs(log.logAt).format('YYYY-MM-DD HH:mm') }}
          </time>
        </header>
        <p class="text">{{ log.text }}</p>
        <MediaSwiper
          v-if="log.medias.length"
          class="medias"
          :medias="log.medias"
        />
      </article>

      <div v-if="userStore.user?.id === log.userId" class="actions m-panel">
        <ElButton
          :icon="editing ? Close : Edit"
          text
          @click="editing = !editing"
        />
        <ElButton
          :icon="Delete"
          :loading="deleting"
          type="danger"
          text
          @click="onDelete"
        />
      </div>

      <LogEditor v-if="editing" :log="log" @done="onSaved" />
    </template>
  </ElScrollbar>
</template>

<style lang="scss" scoped>
.log {
  .state {
    padding: 24px;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px 0;

    > .meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 0 20px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    > .text {
      padding: 0 20px;
      font-size: clamp(17px, 2.6vw, 20px);
      line-height: 1.8;
      white-space: pre-wrap;
      word-break: break-word;
    }

    > .medias {
      height: 500px;
      min-width: 0;
      background: var(--el-fill-color-light);
    }
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    padding: 12px;
  }
}
</style>
