import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  base: '/docs/',
  cleanUrls: true,
  title: '多元记',
  titleTemplate: ':title｜多元记',
  description: '多元记使用指南：记录、整理、查询和分享生活中的多元内容。',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/docs/logo.svg' }],
  ],
  lastUpdated: true,
  themeConfig: {
    logo: { src: '/logo.svg', alt: '多元记' },
    nav: [
      { text: '使用指南', link: '/preface/' },
      { text: '更新日志', link: '/changelog' },
      { text: '常见问题', link: '/help/faq' },
      { text: '打开多元记', link: 'https://mylog.ink' },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Qubit-01/mylog3' },
      { icon: 'qq', link: 'https://qm.qq.com/q/qGpVGuYuUU' },
    ],
    sidebar: [
      {
        text: '介绍',
        items: [
          { text: '写在前面', link: '/preface/' },
          { text: '开始使用', link: '/start/' },
        ],
      },
      {
        text: '记录',
        items: [
          { text: '创建与管理记录', link: '/records/' },
          {
            text: '记录多元内容',
            link: '/records/attachments',
          },
        ],
      },
      {
        text: '组织',
        items: [
          { text: '筛选记录', link: '/organize/filter' },
          { text: '分享记录', link: '/organize/share' },
        ],
      },
      {
        text: '账户',
        items: [{ text: '账户、外观与存储', link: '/account/' }],
      },
      {
        text: '更多',
        items: [
          { text: '更新日志', link: '/changelog' },
          { text: '常见问题', link: '/help/faq' },
        ],
      },
    ],
    outline: {
      level: [2, 3],
      label: '本页内容',
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
    lastUpdated: {
      text: '最后更新于',
    },
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '返回顶部',
    externalLinkIcon: true,
    footer: {
      message: '把生活写下来，也把它还给自己。',
      copyright: '多元记',
    },
  },
})
