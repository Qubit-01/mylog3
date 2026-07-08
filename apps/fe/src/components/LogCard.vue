<script lang="ts" setup>
/** Log 卡片：最基础的展示形式，显示时间、正文、标签 */
import { deleteLog, type Log } from '@/api'
import { useLogStore } from '@/stores/log'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

const props = defineProps<{
  /** 当前展示的 Log 数据 */
  log: Log
}>()

const logStore = useLogStore()
const userStore = useUserStore()
const pending = ref(false)
const canDelete = computed(() => userStore.user?.id === props.log.userId)

/** 删除当前 Log；仅作者本人可见入口，成功后同步清理所有列表缓存 */
const onDelete = async () => {
  if (pending.value) return
  pending.value = true
  try {
    await ElMessageBox.confirm('删除后不可恢复', '确定删除这条记录吗？', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
    })
    await deleteLog({ id: props.log.id })
    logStore.remove(props.log.id)
    ElMessage.success('已删除')
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') throw e
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <article class="LogCard m-panel">
    <div class="meta">
      <div class="info">
        <span>#{{ log.userId }}</span>
        <span>{{ dayjs(log.logAt).format('YYYY-MM-DD HH:mm') }}</span>
      </div>
      <div v-if="canDelete" class="actions">
        <ElButton
          :icon="Delete"
          :loading="pending"
          :disabled="pending"
          type="danger"
          text
          circle
          aria-label="删除记录"
          @click="onDelete"
        />
      </div>
    </div>
    <p class="text">{{ log.text }}</p>
    <LogCardMedias :medias="log.medias" />
    <div v-if="log.tags.length" class="tags">
      <span v-for="t in log.tags" :key="t">#{{ t }}</span>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.LogCard {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;

  > .meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    > .info {
      display: flex;
      flex: 1 1 auto;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
    }

    > .actions {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 4px;
    }
  }

  > .text {
    white-space: pre-wrap;
    word-break: break-word;
  }

  > .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 12px;
    color: var(--el-color-primary);
  }
}
</style>
