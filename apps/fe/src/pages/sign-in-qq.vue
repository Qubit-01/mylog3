<!--
sign-in-qq：
- 验证 QQ OAuth 回调；未绑定时由用户选择登录绑定或一键注册。
- 待处理的 QQ 身份保存在后端签发的 HttpOnly Cookie 中，刷新页面仍可恢复。
-->
<script lang="ts" setup>
import { bindQq, callbackQq, signIn, signUpQq } from '../api'

definePage({ meta: { title: 'QQ 登录' } })

const route = useRoute()
const error = ref('')
const showSignIn = ref(false)
const registering = ref(false)
const qq = shallowRef<{
  redirect: string
  nickname: string
  avatar: string | null
}>()
/** 回调页离开后不再强制跳转；已发出的请求可自然结束。 */
let shouldRedirect = true

/** 完成 QQ 登录流程；离开回调页后不再强制跳转 */
const completeQqSignIn = (redirect: string) => {
  if (!shouldRedirect) return
  location.replace(redirect)
}

/** 从本地 Error 或后端异常契约中读取适合页面展示的消息 */
const getErrorMessage = (cause: unknown) => {
  const message = (cause as { message?: string | string[] }).message
  return Array.isArray(message)
    ? message.join('；')
    : (message ?? 'QQ 登录失败，请返回重试')
}

onMounted(async () => {
  try {
    const result = await callbackQq({
      code: typeof route.query.code === 'string' ? route.query.code : undefined,
      state:
        typeof route.query.state === 'string' ? route.query.state : undefined,
    })
    if (!result.profile) {
      completeQqSignIn(result.redirect)
    } else {
      qq.value = { redirect: result.redirect, ...result.profile }
    }
  } catch (cause) {
    error.value = getErrorMessage(cause)
  }
})

/** 离开回调页后不再强制跳转；短期 QQ 身份由服务端自动过期 */
onBeforeRouteLeave(() => {
  shouldRedirect = false
})

/** 放弃当前 QQ 登录并返回本站登录页 */
const redirectToSignIn = () => {
  location.replace('/sign-in')
}

/** 使用 QQ 昵称和头像创建本站账号并登录 */
const signUp = async () => {
  registering.value = true
  try {
    await signUpQq()
    completeQqSignIn(qq.value!.redirect)
  } catch {
    /* 错误提示由 api middleware 兜底 */
  } finally {
    registering.value = false
  }
}

/** 登录已有本站账号后，绑定当前 QQ 并跳回原页面 */
const signInAndBind = async (payload: Parameters<typeof signIn>[0]) => {
  await signIn(payload)
  await bindQq()
  completeQqSignIn(qq.value!.redirect)
}
</script>

<template>
  <div class="sign-in-qq">
    <div v-if="!qq && !error" class="state">正在通过 QQ 登录…</div>
    <div v-else-if="error" class="state">
      <p>{{ error }}</p>
      <ElButton type="primary" @click="redirectToSignIn">返回登录</ElButton>
    </div>
    <div v-else-if="qq" class="content">
      <div class="qq">
        <ElAvatar :src="qq.avatar ?? undefined" :size="56" />
        <div class="info">
          <strong>{{ qq.nickname }}</strong>
          <span>该 QQ 还没有对应的本站账号</span>
        </div>
      </div>
      <template v-if="showSignIn">
        <p class="tip">登录后会自动绑定当前 QQ</p>
        <AuthSignInUp :submit-sign-in="signInAndBind" />
        <ElButton plain @click="showSignIn = false">返回选择</ElButton>
      </template>
      <template v-else>
        <p class="tip">你有本站账号吗？</p>
        <ElButton type="primary" @click="showSignIn = true">
          有，登录并绑定
        </ElButton>
        <ElButton :loading="registering" @click="signUp">
          没有，注册并登录
        </ElButton>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sign-in-qq {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;

  > .state,
  > .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: min(360px, 100%);
  }

  > .content {
    align-items: stretch;

    > .qq {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      background: var(--el-bg-color);

      > .info {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 4px;

        > span {
          color: var(--el-text-color-secondary);
          font-size: 13px;
        }
      }
    }

    > .tip {
      margin: 0;
      color: var(--el-text-color-secondary);
      text-align: center;
    }

    // 覆盖 Element Plus 横向相邻按钮的默认间距，保持纵向按钮等宽
    > .el-button + .el-button {
      margin-left: 0;
    }
  }
}
</style>
