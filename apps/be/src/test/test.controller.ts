import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller('test')
export class TestController {
  /**
   * 测试后端服务是否正常
   * @returns "Hello World!"
   */
  @Get('hello')
  hello(@Body() body: any) {
    console.log('🐤 Hello World! get');
    console.log('🐤 Body', body);
    return `🐤 Hello World! ${JSON.stringify(body)}`;
  }

  /**
   * 测试后端服务是否正常
   * @returns "Hello World!"
   */
  @Post('hello_post')
  helloPost(@Body() body: any) {
    console.log('🐤 Hello World! post');
    console.log('🐤 Body', body);
    return `🐤 Hello World! ${JSON.stringify(body)}`;
  }
}
