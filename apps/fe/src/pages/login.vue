<script lang="ts" setup>
/** 登录 / 注册页：最简实现 */
import { createCaptcha, register } from '../api'

const route = useRoute()
const router = useRouter()

/** 模式由 URL query.mode 决定 */
const isRegister = computed(() => route.query.mode === 'register')

const form = reactive({ name: '', pswd: '', captcha: '' })
/** 二次确认密码，仅用于前端校验，不参与提交 */
const pswdConfirm = ref('')

/** 当前一次性验证码；svg 包成 dataURL 用 <img> 渲染，避免 v-html */
const captcha = ref<{ id: string; svg: string }>()
const captchaSrc = computed(() =>
  captcha.value
    ? `data:image/svg+xml;utf8,${encodeURIComponent(captcha.value.svg)}`
    : '',
)
const refreshCaptcha = async () => (captcha.value = await createCaptcha())

/** 进入或切到 register 时自动拉验证码 */
watch(isRegister, (v) => v && refreshCaptcha(), { immediate: true })

const toggleMode = () =>
  router.replace({ query: isRegister.value ? {} : { mode: 'register' } })

const onSubmit = async () => {
  if (!isRegister.value) return ElMessage.info('登录接口尚未实现')
  if (form.pswd !== pswdConfirm.value) return ElMessage.error('两次密码不一致')
  try {
    await register({ ...form, captchaId: captcha.value!.id })
    ElMessage.success('注册成功')
    Object.assign(form, { pswd: '', captcha: '' })
    pswdConfirm.value = ''
    router.replace({ query: {} })
  } catch {
    refreshCaptcha()
  }
}
</script>

<template>
  <div class="login">
    <form class="card" @submit.prevent="onSubmit">
      <h1>{{ isRegister ? '注册' : '登录' }}</h1>
      <ElInput
        v-model="form.name"
        placeholder="用户名"
        autocomplete="username"
      />
      <ElInput
        v-model="form.pswd"
        type="password"
        placeholder="密码"
        show-password
        :autocomplete="isRegister ? 'new-password' : 'current-password'"
      />
      <template v-if="isRegister">
        <ElInput
          v-model="pswdConfirm"
          type="password"
          placeholder="确认密码"
          show-password
          autocomplete="new-password"
        />
        <div class="captcha-row">
          <ElInput
            v-model="form.captcha"
            placeholder="验证码"
            maxlength="4"
            autocomplete="one-time-code"
          />
          <img
            class="captcha-img"
            :src="captchaSrc"
            alt="验证码"
            @click="refreshCaptcha"
          />
        </div>
      </template>
      <ElButton type="primary" native-type="submit">
        {{ isRegister ? '注册' : '登录' }}
      </ElButton>
      <a class="switch" @click="toggleMode">
        {{ isRegister ? '已有账号，去登录' : '没有账号，去注册' }}
      </a>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  > .card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 320px;
    padding: 24px;
    border: 1px solid #eee;
    border-radius: 8px;
    > .captcha-row {
      display: flex;
      gap: 8px;
      > .el-input {
        flex: 1;
      }
      > .captcha-img {
        flex: 0 0 100px;
        height: 32px;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        object-fit: cover;
      }
    }
    > .switch {
      text-align: center;
      font-size: 13px;
      color: var(--el-color-primary);
      cursor: pointer;
    }
  }
}
</style>
