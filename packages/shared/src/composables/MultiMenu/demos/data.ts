import type { MultiMenuData } from '..'

export const menuData: MultiMenuData[] = [
  {
    type: 'item',
    text: '关于我们',
    icon: 'https://static.yximgs.com/udata/pkg/WEB-LIVE/kwai_icon.8f6787d8.ico',
    children: [
      {
        type: 'link',
        text: '关于快手',
        link: 'https://www.kuaishou.com/about/',
      },
      { type: 'link', text: '加入我们', link: 'https://zhaopin.kuaishou.com/' },
      {
        type: 'link',
        text: '企业社会责任',
        link: 'https://www.kuaishou.com/csr',
      },
      {
        type: 'link',
        text: '推广快手',
        link: 'https://kuaiyitui.kuaishou.com/',
      },
      {
        type: 'link',
        text: '联系我们',
        link: 'https://www.kuaishou.com/about/contact',
      },
      {
        type: 'link',
        text: '商务合作',
        link: 'https://e.kuaishou.com/#/e/home',
      },
      {
        type: 'link',
        text: '违规举报',
        link: 'https://www.kuaishou.com/help/report',
      },
      {
        type: 'link',
        text: '法律声明',
        link: 'https://www.kuaishou.com/about/policy',
      },
      {
        type: 'link',
        text: '帮助中心',
        link: 'https://www.kuaishou.com/help/feedback',
      },
      { type: 'link', text: '中文官网', link: 'https://www.kuaishou.com/cn' },
      { type: 'link', text: '英文官网', link: 'https://www.kuaishou.com/en' },
      {
        type: 'link',
        text: '专家委员会',
        link: 'https://www.kuaishou.com/committee/',
      },
      { type: 'link', text: '社区规范', link: 'https://www.kuaishou.com/norm' },
      {
        type: 'link',
        text: '媒体资料库',
        link: 'https://www.kuaishou.com/official/material-lib',
      },
      {
        type: 'link',
        text: '投资者关系',
        link: 'https://ir.kuaishou.com/zh-hans',
      },
      {
        type: 'link',
        text: '廉正举报',
        link: 'https://jubao.kuaishou.com/#/?channel=KSPC',
      },
      { type: 'link', text: '知识产权平台', link: 'https://ipp.kuaishou.com/' },
    ],
  },
  {
    type: 'item',
    text: '菜单1-2',
  },
  {
    type: 'item',
    text: '菜单1-3',
    children: [
      {
        type: 'item',
        text: '菜单2-1',
      },
      {
        type: 'item',
        text: '菜单2-2',
      },
      {
        type: 'item',
        text: '菜单2-3',
        children: [
          {
            type: 'item',
            text: '菜单3-1',
          },
          {
            type: 'item',
            text: '菜单3-2',
            children: [
              {
                type: 'item',
                text: '机构认证',
              },
              {
                type: 'item',
                text: '机构入驻',
              },
              {
                type: 'item',
                text: '机构服务',
                children: [
                  {
                    type: 'item',
                    text: '机构认证',
                  },
                  {
                    type: 'item',
                    text: '机构入驻',
                    children: [
                      {
                        type: 'item',
                        text: '机构认证',
                      },
                      {
                        type: 'item',
                        text: '机构入驻',
                      },
                    ],
                  },
                  {
                    type: 'item',
                    text: '机构服务',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]
