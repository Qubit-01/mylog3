import 'dotenv/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CaptchaModule } from './captcha/captcha.module';
import { AppLoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { LogModule } from './log/log.module';

@Module({
  imports: [
    AppLoggerModule,
    PrismaModule,
    CaptchaModule,
    AuthModule,
    UserModule,
    LogModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
