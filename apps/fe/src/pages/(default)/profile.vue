<script lang="ts" setup>
/** 个人页：集中展示当前用户身份信息与账户操作 */
import { logout } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

definePage({ meta: { auth: true, title: '个人' } })

const userStore = useUserStore()
/** 当前用户；鉴权路由保证页面挂载时一定存在 */
const user = computed(() => userStore.user!)
/** 退出请求是否正在进行，用于防止重复提交 */
const pending = ref(false)
/** 当前展开的资料区，默认展示账户信息 */
const active = ref('account')

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
  <ElScrollbar class="profile" wrap-class="wrap" view-class="view">
    <header class="intro m-panel">
      <ElAvatar :src="user.avatar ?? undefined" :size="88" :alt="user.name">
        {{ user.name.slice(0, 1) }}
      </ElAvatar>
      <div class="identity">
        <h1>{{ user.name }}</h1>
        <p>在这里，记下生活。</p>
      </div>
    </header>

    <ElCollapse v-model="active" class="account m-panel" accordion>
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
  height: 100%;

  :deep(.wrap) {
    display: flex;
    justify-content: center;
    overscroll-behavior: contain;
  }

  :deep(.view) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: var(--content-max-width);
    padding: 12px 12px calc(env(safe-area-inset-bottom) + 100px);
  }

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
  }

  .actions {
    display: flex;
    justify-content: center;
    padding: 8px 16px;
  }
}
</style>
