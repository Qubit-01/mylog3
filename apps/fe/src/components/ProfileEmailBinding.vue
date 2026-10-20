<!--
ProfileEmailBinding：
- 展示当前认证账号的邮箱，未绑定时通过邮件验证码完成绑定。
- 发送倒计时在关闭弹窗后保留；接口错误由统一 middleware 提示。
-->
<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { bindEmail, sendEmailCode } from '@/api'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
/** 邮箱绑定弹窗是否打开 */
const visible = ref(false)
/** 绑定请求体；邮箱只在后端验证成功后写入账号 */
const form = reactive<Parameters<typeof bindEmail>[0]>({ email: '', code: '' })
/** 表单校验实例 */
const formRef = useTemplateRef<FormInstance>('formRef')
/** 验证码发送期间锁定输入与重复请求 */
const sending = ref(false)
/** 邮箱绑定提交期间禁止关闭弹窗与重复提交 */
const binding = ref(false)
/** 任一请求进行时锁定表单，避免发送与绑定交叉提交 */
const pending = computed(() => sending.value || binding.value)
/** 与后端使用相同的邮箱规范化方式，输入变化时自动重新比较发送目标 */
const normalizedEmail = computed(() => form.email.trim().toLowerCase())
/** 最近成功发送的目标邮箱；修改目标后必须重新发送 */
const sentEmail = ref('')
/** 使用 VueUse 管理重发倒计时，组件卸载时自动清理计时器 */
const { remaining, start } = useCountdown(0)

/** 校验邮箱后发送验证码，成功才开始倒计时 */
const onSend = async () => {
  if (pending.value || remaining.value) return
  sending.value = true
  try {
    if (!(await formRef.value?.validateField('email'))) return
    const result = await sendEmailCode({ email: form.email })
    sentEmail.value = normalizedEmail.value
    form.code = ''
    start(result.retryAfter)
  } catch {
    /* 表单错误就近展示，接口错误由 api middleware 统一提示。 */
  } finally {
    sending.value = false
  }
}

/** 验证成功后刷新当前邮箱；本地直接更新，避免刷新接口失败导致重复绑定 */
const onBind = async () => {
  if (
    pending.value ||
    !sentEmail.value ||
    sentEmail.value !== normalizedEmail.value
  )
    return
  binding.value = true
  try {
    if (!(await formRef.value?.validate())) return
    await bindEmail(form)
    if (userStore.user) userStore.user.email = sentEmail.value
    visible.value = false
  } catch {
    /* 保留输入方便重试，接口错误由 api middleware 统一提示。 */
  } finally {
    binding.value = false
  }
}
</script>

<template>
  <div class="ProfileEmailBinding">
    <span v-if="userStore.user?.email" class="email">{{
      userStore.user.email
    }}</span>
    <ElButton v-else link type="primary" @click="visible = true">绑定</ElButton>

    <ElDialog
      v-model="visible"
      title="绑定邮箱"
      width="min(420px, calc(100vw - 32px))"
      :close-on-click-modal="false"
      :close-on-press-escape="!pending"
      :show-close="!pending"
      @closed="formRef?.clearValidate()"
    >
      <!-- 规则归属各字段，发送时只校验邮箱，确认绑定时再校验整个表单。 -->
      <ElForm
        id="email-binding"
        ref="formRef"
        class="form"
        :model="form"
        :disabled="pending"
        label-position="top"
        @submit.prevent="onBind"
      >
        <ElFormItem
          label="邮箱地址"
          prop="email"
          :rules="{
            required: true,
            type: 'email',
            max: 100,
            message: '请输入有效的邮箱地址',
            trigger: 'blur',
            transform: (value: string) => value.trim(),
          }"
        >
          <ElInput
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="请输入邮箱地址"
            :maxlength="100"
          />
        </ElFormItem>
        <ElFormItem
          label="验证码"
          prop="code"
          :rules="{
            required: true,
            pattern: /^\d{6}$/,
            message: '请输入 6 位数字验证码',
            trigger: 'blur',
          }"
        >
          <div class="code">
            <ElInput
              v-model="form.code"
              placeholder="6 位数字验证码"
              autocomplete="one-time-code"
              inputmode="numeric"
              :maxlength="6"
            />
            <ElButton
              :loading="sending"
              :disabled="pending || remaining > 0"
              @click="onSend"
            >
              {{ remaining > 0 ? `${remaining} 秒后重发` : '发送验证码' }}
            </ElButton>
          </div>
        </ElFormItem>
        <p v-if="sentEmail" class="hint">
          验证码已发送至 {{ sentEmail }}，5 分钟内有效。
        </p>
      </ElForm>
      <template #footer>
        <ElButton :disabled="pending" @click="visible = false">取消</ElButton>
        <ElButton
          type="primary"
          native-type="submit"
          form="email-binding"
          :loading="binding"
          :disabled="pending || !sentEmail || sentEmail !== normalizedEmail"
          >确认绑定</ElButton
        >
      </template>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.ProfileEmailBinding {
  display: flex;
  align-items: center;
  min-width: 0;

  > .email {
    overflow-wrap: anywhere;
    text-align: right;
  }

  .form {
    display: flex;
    flex-direction: column;

    .code {
      display: flex;
      gap: 8px;
      width: 100%;

      > .el-input {
        flex: 1;
        min-width: 0;
      }
    }

    > .hint {
      color: var(--el-text-color-secondary);
      overflow-wrap: anywhere;
    }
  }
}
</style>
