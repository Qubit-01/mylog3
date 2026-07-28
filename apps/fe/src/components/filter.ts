import type { Log, Where } from '@/api'

type Mode = 'AND' | 'OR'
type WhereValue = NonNullable<Where>

/** Log 筛选表单结构 */
export type Filter = {
  /** 可见范围；空字符串表示全部 */
  scope: '' | Log['scope']
  /** Log 日期范围 */
  logAt: { gte?: string; lte?: string }
  /** 需要排除的 Log ID */
  exclude: Log['id'][]
  /** 条件组之间的组合方式 */
  mode: Mode
  /** 正文关键词及其组合方式 */
  text: { contains?: string[]; mode: Mode }
  /** 人员姓名及其组合方式 */
  people: { contains?: string[]; mode: Mode }
  /** 标签及其组合方式 */
  tags: { contains?: string[]; mode: Mode }
}

/** 将筛选表单转换为完整 Prisma where；没有有效条件时返回 undefined */
export const toWhere = (filter: Filter): Where => {
  const value: WhereValue = {}
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
  if (filter.exclude.length) value.id = { notIn: [...filter.exclude] }

  const groups: WhereValue[] = []
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

  return Object.keys(value).length ? value : undefined
}

/** 将本组件生成的 Prisma where 还原为筛选表单 */
export const toFilter = (where: Where): Filter => {
  const filter: Filter = {
    scope: (where?.scope || '') as Filter['scope'],
    logAt: {},
    exclude: [],
    mode: where?.OR ? 'OR' : 'AND',
    text: { contains: [], mode: 'AND' },
    people: { contains: [], mode: 'AND' },
    tags: { contains: [], mode: 'AND' },
  }
  if (!where) return filter

  const logAt = where.logAt as Filter['logAt'] | undefined
  if (logAt?.gte) {
    filter.logAt.gte = dayjs(logAt.gte).format('YYYY-MM-DD')
  }
  if (logAt?.lte) {
    filter.logAt.lte = dayjs(logAt.lte).format('YYYY-MM-DD')
  }

  const excluded = (where.id as { notIn: Log['id'][] } | undefined)?.notIn
  if (excluded) filter.exclude = [...excluded]

  for (const group of (where[filter.mode] ?? []) as WhereValue[]) {
    const groupMode: Mode = group.OR ? 'OR' : 'AND'
    const conditions = group[groupMode] as WhereValue[]
    const first = conditions[0]

    if (first?.text) {
      filter.text.contains = conditions.map(
        ({ text }) => (text as { contains: string }).contains,
      )
      filter.text.mode = groupMode
    } else if (first?.people) {
      filter.people.contains = conditions.map(
        ({ people }) => (people as { array_contains: string }).array_contains,
      )
      filter.people.mode = groupMode
    } else if (first?.tags) {
      filter.tags.contains = conditions.map(
        ({ tags }) => (tags as { array_contains: [string] }).array_contains[0],
      )
      filter.tags.mode = groupMode
    }
  }

  return filter
}
