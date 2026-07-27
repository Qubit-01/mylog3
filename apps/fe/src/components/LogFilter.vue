<!--
LogFilter：
- 编辑“我的 Log”筛选条件，并直接生成后端接收的 Prisma where。
- 时间上下界可独立筛选；正文、人员、标签各自及彼此可选择“和 / 或”。
-->
<script lang="ts" setup>
import type { Log, Where } from '@/api'

type Mode = 'AND' | 'OR'
type Filter = {
  scope: '' | Log['scope']
  logAt: { gte?: string; lte?: string }
  mode: Mode
  text: { contains?: string[]; mode: Mode }
  people: { contains?: string[]; mode: Mode }
  tags: { contains?: string[]; mode: Mode }
}

/** 创建默认筛选条件 */
const createFilter = (): Filter => ({
  scope: '',
  logAt: {},
  mode: 'AND',
  text: { contains: [], mode: 'AND' },
  people: { contains: [], mode: 'AND' },
  tags: { contains: [], mode: 'AND' },
})

/** 输出的 Prisma where；undefined 表示没有有效筛选条件 */
const where = defineModel<Where>({ required: true })

/** 筛选表单状态；mode 表示同组条件的组合方式 */
const filter = reactive(createFilter())

/** 结束日期不能早于开始日期 */
watch(
  () => [filter.logAt.gte, filter.logAt.lte],
  ([gte, lte]) => {
    if (gte && lte && dayjs(gte).isAfter(lte, 'day')) {
      filter.logAt.lte = undefined
      ElMessage('结束时间必须在开始时间之后哦！')
    }
  },
)

/** 根据表单状态持续输出完整 Prisma where */
watchEffect(() => {
  const value: NonNullable<Where> = {}
  if (filter.scope) value.scope = filter.scope
  if (filter.logAt.gte || filter.logAt.lte) {
    value.logAt = {
      ...(filter.logAt.gte && {
        gte: dayjs(filter.logAt.gte).startOf('day').toISOString(),
      }),
      ...(filter.logAt.lte && {
        lte: dayjs(filter.logAt.lte).endOf('day').toISOString(),
      }),
    }
  }

  const groups: NonNullable<Where>[] = []
  if (filter.text.contains?.length) {
    groups.push({
      [filter.text.mode]: filter.text.contains.map((text) => ({
        text: { contains: text },
      })),
    })
  }
  if (filter.people.contains?.length) {
    groups.push({
      [filter.people.mode]: filter.people.contains.map((name) => ({
        people: { path: '$[*].name', array_contains: name },
      })),
    })
  }
  if (filter.tags.contains?.length) {
    groups.push({
      [filter.tags.mode]: filter.tags.contains.map((tag) => ({
        tags: { array_contains: [tag] },
      })),
    })
  }
  if (groups.length) value[filter.mode] = groups

  where.value = Object.keys(value).length ? value : undefined
})

/** 清空自定义条件，但保持筛选面板展开 */
const reset = () => {
  Object.assign(filter, createFilter())
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
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="开始日期"
        :editable="false"
        :value-on-clear="undefined"
      />
      <span>至</span>
      <ElDatePicker
        v-model="filter.logAt.lte"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="结束日期"
        :editable="false"
        :value-on-clear="undefined"
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

    <div class="actions">
      <ElButton text @click="reset">重置</ElButton>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.LogFilter {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

  > .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
