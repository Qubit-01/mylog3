<!--
AuthSignInUp：
- 提供账号登录与注册表单，负责验证码和表单校验。
- 通过 v-model 与异步提交回调将流程控制留给宿主。
-->
<script lang="ts" setup>
import { createCaptcha } from '../api'
import type { signIn, signUp } from '../api'

/** 当前登录或注册标签，由宿主控制 */
const activeTab = defineModel<'signIn' | 'signUp'>({ required: true })

const { submitSignIn, submitSignUp } = defineProps<{
  /** 执行宿主提供的登录流程；失败时应 reject */
  submitSignIn: (payload: Parameters<typeof signIn>[0]) => Promise<void>
  /** 执行宿主提供的注册流程；失败时应 reject */
  submitSignUp: (payload: Parameters<typeof signUp>[0]) => Promise<void>
}>()

/** 登录表单；与注册表单隔离，避免切换标签时复用密码 */
const signInForm = reactive({ name: '', pswd: '' })
/** 注册表单；captchaId 在提交时从当前验证码补入 */
const signUpForm = reactive({ name: '', pswd: '', captcha: '' })
/** 二次确认密码，仅用于前端校验，不参与提交 */
const pswdConfirm = ref('')

/** 当前一次性验证码；svg 包成 dataURL 用 <img> 渲染，避免 v-html */
const captcha = ref<{ id: string; svg: string }>()
/** 当前验证码图片地址；尚未加载时为空字符串 */
const captchaSrc = computed(() =>
  captcha.value
    ? `data:image/svg+xml;utf8,${encodeURIComponent(captcha.value.svg)}`
    : '',
)
/** 获取一张新的验证码 */
const refreshCaptcha = async () => (captcha.value = await createCaptcha())

/** 切到注册标签时自动拉取验证码 */
watch(activeTab, (mode) => mode === 'signUp' && refreshCaptcha(), {
  immediate: true,
})

/** 提交登录表单 */
const onSignIn = async () => {
  try {
    await submitSignIn(signInForm)
  } catch {
    /* 错误提示由 api middleware 兜底 */
  }
}

/** 校验并提交注册表单；失败后刷新一次性验证码 */
const onSignUp = async () => {
  if (signUpForm.pswd !== pswdConfirm.value)
    return ElMessage.error('两次密码不一致')
  if (!captcha.value) return ElMessage.warning('验证码加载中，请稍后')

  try {
    await submitSignUp({ ...signUpForm, captchaId: captcha.value.id })
  } catch {
    void refreshCaptcha()
  }
}
</script>

<template>
  <div class="AuthSignInUp">
    <ElTabs v-model="activeTab" stretch>
      <ElTabPane label="登录" name="signIn">
        <form class="form" @submit.prevent="onSignIn">
          <ElInput
            v-model="signInForm.name"
            placeholder="用户名"
            autocomplete="username"
          />
          <ElInput
            v-model="signInForm.pswd"
            type="password"
            placeholder="密码"
            show-password
            autocomplete="current-password"
          />
          <ElButton type="primary" native-type="submit">登录</ElButton>
        </form>
      </ElTabPane>

      <ElTabPane label="注册" name="signUp">
        <form class="form" @submit.prevent="onSignUp">
          <ElInput
            v-model="signUpForm.name"
            placeholder="用户名"
            autocomplete="username"
          />
          <ElInput
            v-model="signUpForm.pswd"
            type="password"
            placeholder="密码"
            show-password
            autocomplete="new-password"
          />
          <ElInput
            v-model="pswdConfirm"
            type="password"
            placeholder="确认密码"
            show-password
            autocomplete="new-password"
          />
          <div class="captcha">
            <ElInput
              v-model="signUpForm.captcha"
              placeholder="验证码"
              maxlength="4"
              autocomplete="one-time-code"
            />
            <img :src="captchaSrc" alt="验证码" @click="refreshCaptcha" />
          </div>
          <ElButton type="primary" native-type="submit">注册</ElButton>
        </form>
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<style lang="scss" scoped>
.AuthSignInUp {
  width: min(360px, 100%);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);

  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 24px 24px;

    > .captcha {
      display: flex;
      gap: 8px;

      > .el-input {
        flex: 1;
        min-width: 0;
      }

      > img {
        flex: 0 0 100px;
        height: 32px;
        border: 1px solid var(--el-border-color);
        border-radius: 4px;
        cursor: pointer;
        object-fit: cover;
      }
    }
  }
}
</style>
