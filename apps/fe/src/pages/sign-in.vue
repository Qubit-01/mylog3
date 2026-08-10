<!--
sign-in：
- 未登录时用标签切换登录与注册；已登录时展示用户信息与操作。
-->
<script lang="ts" setup>
import { signIn, signOut, signUp, startQq } from '../api'
import { useUserStore } from '../stores/user'

definePage({ meta: { title: '登录' } })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

/** 当前标签由 URL query.mode 驱动，同时保留 redirect 等其他查询参数 */
const activeTab = computed<'signIn' | 'signUp'>({
  get: () => (route.query.mode === 'signUp' ? 'signUp' : 'signIn'),
  set: (mode) => {
    void router.replace({
      query: {
        ...route.query,
        mode: mode === 'signUp' ? 'signUp' : undefined,
      },
    })
  },
})

/** 登录/注册成功后回跳目标页（默认首页），整页刷新确保依赖登录态的组件重新初始化 */
const redirect = () => {
  location.href = (route.query.redirect as string) || '/'
}

/** 提交登录表单 */
const onSignIn = async (payload: Parameters<typeof signIn>[0]) => {
  await signIn(payload)
  redirect()
}

/** 提交注册表单 */
const onSignUp = async (payload: Parameters<typeof signUp>[0]) => {
  await signUp(payload)
  redirect()
}

/** 退出当前账号并重新加载页面登录态 */
const onSignOut = async () => {
  await signOut()
  location.reload()
}

/** 发起 QQ 登录，并保留当前页面指定的回跳地址 */
const onSignInQq = async () => {
  const { url } = await startQq({
    redirect: (route.query.redirect as string) || '/',
  })
  location.href = url
}
</script>

<template>
  <div class="sign-in">
    <!-- 已登录：展示用户 + 操作 -->
    <div v-if="userStore.signed" class="account">
      <ElAvatar :src="userStore.user!.avatar ?? undefined" :size="72" />
      <h1>{{ userStore.user!.name }}</h1>
      <ElButton type="primary" @click="router.push('/')">进入首页</ElButton>
      <ElButton type="danger" @click="onSignOut">退出登录</ElButton>
    </div>

    <!-- 未登录：登录/注册标签与独立表单 -->
    <div v-else class="auth">
      <AuthSignInUp
        v-model="activeTab"
        :submit-sign-in="onSignIn"
        :submit-sign-up="onSignUp"
      />
      <ElButton plain @click="onSignInQq">QQ 登录</ElButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sign-in {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;

  > .auth {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: min(360px, 100%);
  }

  > .account {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    width: min(360px, 100%);
    padding: 24px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background: var(--el-bg-color);

    > .el-avatar {
      align-self: center;
    }

    > h1 {
      text-align: center;
    }

    // 覆盖 Element Plus 相邻按钮默认 margin-left，保持列内对齐
    > .el-button + .el-button {
      margin-left: 0;
    }
  }
}
</style>
