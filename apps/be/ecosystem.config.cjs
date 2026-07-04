/**
 * pm2 生产环境配置
 * 使用：pm2 start ecosystem.config.cjs
 * 平滑重启：pm2 reload mylog-be
 */
module.exports = {
  apps: [
    {
      name: 'mylog-be',
      script: 'dist/main.js',
      cwd: '/opt/mylog3/apps/be',
      max_memory_restart: '512M', // 内存超限自动重启，防泄漏
      time: true, // 日志加时间戳
    },
  ],
}
