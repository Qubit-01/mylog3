<!-- 记录时间编辑器：v-model 走 ISO 字符串，内部用 computed 适配 ElDatePicker 的 Date -->
<script lang="ts" setup>
const time = defineModel<string>({ required: true })

const value = computed({
  get: () => new Date(time.value),
  set: (v: Date) => {
    time.value = v.toISOString()
  },
})
</script>

<template>
  <!-- clearable=false 防止清空回传 null；editable=false 禁手输避免脏字符串 -->
  <ElDatePicker
    class="EditorTime"
    v-model="value"
    type="datetime"
    :clearable="false"
    :editable="false"
    placeholder="记录时间"
    format="YYYY-MM-DD HH:mm"
  />
</template>
