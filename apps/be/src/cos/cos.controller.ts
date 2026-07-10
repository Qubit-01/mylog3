import { Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Auth, UserId } from '../auth/auth.guard';
import { CosService } from './cos.service';
import { CosCredentialDto } from './dto/cos-credential.dto';

@ApiTags('cos')
@Controller('cos')
export class CosController {
  constructor(private readonly cosService: CosService) {}

  /** 创建当前用户的 COS 临时凭证 */
  @Auth()
  @Post('credential')
  @ApiOkResponse({
    type: CosCredentialDto,
    description: '创建成功，返回客户端 COS 所需信息',
  })
  createCredential(@UserId() userId: number): Promise<CosCredentialDto> {
    return this.cosService.createCredential(userId);
  }
}
