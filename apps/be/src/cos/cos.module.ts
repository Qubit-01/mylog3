import { Module } from '@nestjs/common';
import { CosController } from './cos.controller';
import { CosService } from './cos.service';

/** 腾讯云 COS 基建模块，集中管理存储桶配置和临时密钥申请 */
@Module({
  controllers: [CosController],
  providers: [CosService],
  exports: [CosService],
})
export class CosModule {}
