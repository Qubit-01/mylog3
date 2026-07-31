<!--
LogFilter：
- 编辑“我的 Log”筛选条件，并与后端接收的 Prisma where 双向转换。
- 时间上下界可独立筛选；正文、人员、标签各自及彼此可选择“和 / 或”。
- 支持按 Log ID 排除结果，排除条件不参与条件组的“和 / 或”组合。
-->
<script lang="ts" setup>
import type { Where } from '@/api'
import { toFilter, toWhere } from './filter'
import { isEqual } from 'lodash-unified'

/** 输出的 Prisma where；undefined 表示没有有效筛选条件 */
const where = defineModel<Where>({ required: true })

/** where 的表单投影；仅供模板组件编辑 */
const filter = ref(toFilter(where.value))

/**
 * 双向同步主状态 where 与表单投影
 * - filter 的深层编辑转换为完整 where。
 * - 无效日期在写入前清理；结构相同的 where 保持引用，避免重复查询。
 * - 初始化已由 toFilter 完成，避免挂载时反向改写 where。
 */
syncRef(where, filter, {
  deep: true,
  immediate: false,
  transform: {
    ltr: toFilter,
    rtl: (value) => {
      const { gte, lte } = value.logAt
      if (gte && lte && dayjs(gte).isAfter(lte, 'day')) {
        value.logAt.lte = undefined
        ElMessage('结束时间必须在开始时间之后哦！')
      }
      const next = toWhere(value)
      return isEqual(where.value, next) ? where.value : next
    },
  },
})

/** 清空自定义条件，但保持筛选面板展开 */
const reset = () => {
  filter.value = toFilter(undefined)
}
</script>

<template>
  <section class="LogFilter m-panel">
    <div class="item">
      <span class="label">范围</span>
      <ElSegmented
        v-model="filter.scope"
        :options="[
          { label: '全部', value: '' },
          { label: '隐私', value: 'PRIVATE' },
          { label: '公开', value: 'PUBLIC' },
        ]"
        size="small"
      />
    </div>

    <div class="item">
      <span class="label">时间</span>
      <ElDatePicker
        v-model="filter.logAt.gte"
        value-format="YYYY-MM-DD"
        placeholder="开始日期"
        :editable="false"
      />
      <span>至</span>
      <ElDatePicker
        v-model="filter.logAt.lte"
        value-format="YYYY-MM-DD"
        placeholder="结束日期"
        :editable="false"
      />
    </div>

    <div class="item">
      <span class="label">正文</span>
      <ElInputTag
        v-model="filter.text.contains"
        placeholder="输入关键词后回车"
        clearable
      />
      <ElSwitch
        v-model="filter.text.mode"
        active-value="OR"
        inactive-value="AND"
        active-text="或"
        inactive-text="和"
        inline-prompt
      />
    </div>

    <div class="item">
      <span class="label">人员</span>
      <ElInputTag
        v-model="filter.people.contains"
        placeholder="输入姓名后回车"
        clearable
      />
      <ElSwitch
        v-model="filter.people.mode"
        active-value="OR"
        inactive-value="AND"
        active-text="或"
        inactive-text="和"
        inline-prompt
      />
    </div>

    <div class="item">
      <span class="label">标签</span>
      <ElInputTag
        v-model="filter.tags.contains"
        placeholder="输入标签后回车"
        clearable
      />
      <ElSwitch
        v-model="filter.tags.mode"
        active-value="OR"
        inactive-value="AND"
        active-text="或"
        inactive-text="和"
        inline-prompt
      />
    </div>

    <div class="item">
      <span class="label">条件组</span>
      <ElSwitch
        v-model="filter.mode"
        active-value="OR"
        inactive-value="AND"
        active-text="或"
        inactive-text="和"
        inline-prompt
      />
    </div>

    <div v-if="filter.exclude.length" class="item">
      <span class="label">排除</span>
      <ElTag
        v-for="id in filter.exclude"
        :key="id"
        closable
        @close="filter.exclude.splice(filter.exclude.indexOf(id), 1)"
      >
        {{ id }}
      </ElTag>
    </div>

    <ElButton class="reset" size="small" @click="reset">重置</ElButton>
  </section>
</template>

<style lang="scss" scoped>
.LogFilter {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;

  > .item {
    display: flex;
    align-items: center;
    gap: 8px;

    > .label {
      flex: 0 0 64px;
      color: var(--el-text-color-secondary);
      font-size: 13px;
    }

    > :deep(.el-input-tag),
    > :deep(.el-date-editor) {
      flex: 1;
      min-width: 0;
    }
  }

  > .reset {
    position: absolute;
    top: 8px;
    right: 8px;
  }
}
</style>
