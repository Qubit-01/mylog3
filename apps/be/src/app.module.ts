import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestController } from './test/test.controller';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule],
  controllers: [TestController, AppController],
  providers: [AppService],
})
export class AppModule {}
