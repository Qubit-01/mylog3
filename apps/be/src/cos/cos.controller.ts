import { Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Auth, UserId } from '../auth/auth.guard';
import { CosService } from './cos.service';
import { CosUploadCredentialDto } from './dto/cos-upload-credential.dto';

@ApiTags('cos')
@Controller('cos')
export class CosController {
  constructor(private readonly cosService: CosService) {}

  /** 创建当前用户的 COS 直传临时凭证 */
  @Auth()
  @Post('create-upload-credential')
  @ApiOkResponse({
    type: CosUploadCredentialDto,
    description: '创建成功，返回客户端直传 COS 所需信息',
  })
  createUploadCredential(
    @UserId() userId: number,
  ): Promise<CosUploadCredentialDto> {
    return this.cosService.createUploadCredential(userId);
  }
}
