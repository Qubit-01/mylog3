import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller()
export class AppController {
  /**
   * 测试后端服务是否正常（GET）
   * 访问：GET /hello
   */
  @Get('hello')
  hello(@Body() body: unknown): string {
    console.log('🐤 Hello World!', body);
    return `🐤 Hello World! ${JSON.stringify(body)}`;
  }

  /**
   * 测试后端服务是否正常（POST）
   * 访问：POST /hello
   */
  @Post('hello')
  helloPost(@Body() body: unknown): string {
    console.log('🐤 Hello World!', body);
    return `🐤 Hello World! ${JSON.stringify(body)}`;
  }
}
