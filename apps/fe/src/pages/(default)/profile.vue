<script lang="ts" setup>
/** 个人页：集中展示当前用户身份信息与账户操作 */
import { logout } from '@/api'
import { getCosUsage } from '@/composables/cos'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

definePage({ meta: { auth: true, title: '个人' } })

const userStore = useUserStore()
/** 当前用户；鉴权路由保证页面挂载时一定存在 */
const user = computed(() => userStore.user!)
/** 用户选择的颜色模式，`auto` 表示跟随系统 */
const { store: mode } = useColorMode()
/** 退出请求是否正在进行，用于防止重复提交 */
const pending = ref(false)
/** 当前展开的资料区，默认展示账户信息与外观设置 */
const active = ref(['account', 'appearance'])
/** 按需查询的存储信息及请求状态，成功结果在本次页面生命周期内复用 */
const {
  state: usage,
  isLoading: usagePending,
  error: usageError,
  execute: fetchUsage,
} = useAsyncState(getCosUsage, undefined, { immediate: false })
watch(
  active,
  (names) =>
    names.includes('storage') &&
    !usage.value &&
    !usagePending.value &&
    fetchUsage(),
)

/** 将 COS 字节数格式化为适合页面展示的单位 */
const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 4)
  return `${new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
  }).format(bytes / 1024 ** index)} ${['B', 'KB', 'MB', 'GB', 'TB'][index]}`
}

/** 退出当前账号并刷新应用登录态 */
const onLogout = async () => {
  if (pending.value) return
  pending.value = true
  try {
    await logout()
    location.href = '/'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <ElScrollbar
    class="profile default-scrollbar"
    wrap-class="wrap"
    view-class="view"
  >
    <header class="intro m-panel">
      <ElAvatar :src="user.avatar ?? undefined" :size="88" :alt="user.name">
        {{ user.name.slice(0, 1) }}
      </ElAvatar>
      <div class="identity">
        <h1>{{ user.name }}</h1>
        <p>在这里，记下生活。</p>
      </div>
    </header>

    <ElCollapse v-model="active" class="account m-panel">
      <ElCollapseItem title="账户信息" name="account">
        <div class="details">
          <div class="item">
            <span class="label">用户编号</span>
            <span>#{{ user.id }}</span>
          </div>
          <div class="item">
            <span class="label">加入时间</span>
            <time :datetime="String(user.createdAt)">
              {{ dayjs(user.createdAt).format('YYYY 年 M 月') }}
            </time>
          </div>
        </div>
      </ElCollapseItem>
      <ElCollapseItem title="外观设置" name="appearance">
        <div class="details">
          <div class="item">
            <span class="label">颜色模式</span>
            <ElSegmented
              v-model="mode"
              :options="[
                { value: 'auto', icon: 'Monitor' },
                { value: 'light', icon: 'Sunny' },
                { value: 'dark', icon: 'Moon' },
              ]"
              size="small"
            >
              <template #default="{ item }">
                <ElIcon>
                  <component :is="item.icon" />
                </ElIcon>
              </template>
            </ElSegmented>
          </div>
        </div>
      </ElCollapseItem>
      <ElCollapseItem title="存储信息" name="storage">
        <div v-if="usage" class="details">
          <div class="item">
            <span class="label">文件数量</span>
            <span>{{ usage.objectCount }}</span>
          </div>
          <div class="item">
            <span class="label">已用空间</span>
            <span>{{ formatBytes(usage.totalBytes) }}</span>
          </div>
          <div class="item">
            <span class="label">原文件</span>
            <span>{{ formatBytes(usage.originalBytes) }}</span>
          </div>
          <div class="item">
            <span class="label">预览文件</span>
            <span>{{ formatBytes(usage.previewBytes) }}</span>
          </div>
          <template v-if="usage.objectCount">
            <h3>目录用量</h3>
            <div
              v-for="item in usage.directories"
              :key="item.name"
              class="item"
            >
              <span class="label">{{ item.name }}</span>
              <span>
                {{ item.objectCount }} 个 · {{ formatBytes(item.totalBytes) }}
              </span>
            </div>
            <h3>文件后缀</h3>
            <div v-for="item in usage.extensions" :key="item.name" class="item">
              <span class="label">
                {{ item.name === '无后缀' ? item.name : `.${item.name}` }}
              </span>
              <span>
                {{ item.objectCount }} 个 · {{ formatBytes(item.totalBytes) }}
              </span>
            </div>
          </template>
        </div>
        <div v-else class="status">
          <span>{{ usageError ? '获取失败' : '正在统计…' }}</span>
          <ElButton v-if="usageError" link type="primary" @click="fetchUsage()">
            重试
          </ElButton>
        </div>
      </ElCollapseItem>
    </ElCollapse>

    <footer class="actions m-panel">
      <ElButton type="danger" text :loading="pending" @click="onLogout">
        退出登录
      </ElButton>
    </footer>
  </ElScrollbar>
</template>

<style lang="scss" scoped>
.profile {
  .intro {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px;

    > .el-avatar {
      flex: 0 0 auto;
    }

    > .identity {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;

      > h1 {
        font-size: 24px;
        font-weight: 700;
      }

      > p {
        color: var(--el-text-color-secondary);
      }
    }
  }

  .account {
    --el-collapse-header-bg-color: transparent;
    --el-collapse-content-bg-color: transparent;

    padding: 0 28px;

    .details {
      display: flex;
      flex-direction: column;

      > h3 {
        padding-top: 16px;
        font-size: 13px;
        font-weight: 600;
        color: var(--el-text-color-secondary);
      }

      > .item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        min-height: 44px;

        & + .item {
          border-top: 1px solid var(--el-border-color-extra-light);
        }

        > .label {
          color: var(--el-text-color-secondary);
        }
      }
    }

    .status {
      display: flex;
      align-items: center;
      gap: 4px;
      min-height: 44px;
      color: var(--el-text-color-secondary);
    }
  }

  .actions {
    display: flex;
    justify-content: center;
    padding: 8px 16px;
  }
}
</style>
