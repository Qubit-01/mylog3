<script lang="ts" setup>
/** 登录 / 注册页：已登录展示用户信息；否则按 mode 切换登录/注册 */
import { createCaptcha, login, logout, register } from '../api'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

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

/** 切到 register 时自动拉验证码（未登录才有意义） */
watch(
  [() => userStore.logged, isRegister],
  ([logged, reg]) => !logged && reg && refreshCaptcha(),
  { immediate: true },
)

const toggleMode = () =>
  router.replace({ query: isRegister.value ? {} : { mode: 'register' } })

/** 登录/注册成功后回跳目标页（默认首页），整页刷新确保依赖登录态的组件重新初始化 */
const redirect = () => {
  location.href = (route.query.redirect as string) || '/'
}

const onSubmit = async () => {
  if (isRegister.value) {
    if (form.pswd !== pswdConfirm.value)
      return ElMessage.error('两次密码不一致')
    try {
      await register({ ...form, captchaId: captcha.value!.id })
      redirect()
    } catch {
      refreshCaptcha()
    }
    return
  }
  try {
    await login({ name: form.name, pswd: form.pswd })
    redirect()
  } catch {
    /* 错误提示由 api middleware 兜底 */
  }
}

const onLogout = async () => {
  await logout()
  location.reload()
}
</script>

<template>
  <div class="login">
    <!-- 已登录：展示用户 + 操作 -->
    <div v-if="userStore.logged" class="card">
      <ElAvatar :src="userStore.user!.avatar ?? undefined" :size="72" />
      <h1>{{ userStore.user!.name }}</h1>
      <ElButton type="primary" @click="router.push('/')">进入首页</ElButton>
      <ElButton type="danger" @click="onLogout">退出登录</ElButton>
    </div>

    <!-- 未登录：登录/注册表单 -->
    <form v-else class="card" @submit.prevent="onSubmit">
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
        <div class="captcha">
          <ElInput
            v-model="form.captcha"
            placeholder="验证码"
            maxlength="4"
            autocomplete="one-time-code"
          />
          <img :src="captchaSrc" alt="验证码" @click="refreshCaptcha" />
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
    align-items: stretch;
    gap: 12px;
    width: 320px;
    padding: 24px;
    border: 1px solid #eee;
    border-radius: 8px;
    > h1 {
      margin: 0;
      text-align: center;
    }
    > .el-avatar {
      align-self: center;
    }
    // 覆盖 Element Plus 相邻按钮默认 margin-left，保持列内对齐
    > .el-button + .el-button {
      margin-left: 0;
    }
    > .captcha {
      display: flex;
      gap: 8px;
      > .el-input {
        flex: 1;
      }
      > img {
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
