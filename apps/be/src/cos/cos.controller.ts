import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Auth, UserId } from '../auth/auth.guard';
import { CosService } from './cos.service';
import { CosCredentialDto } from './dto/cos-credential.dto';
import { CreateDownloadUrlDto, DownloadUrlDto } from './dto/download-url.dto';

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

  /** 创建带指定文件名的 COS 短时下载地址 */
  @Auth()
  @Post('download-url')
  @ApiBody({ type: CreateDownloadUrlDto })
  @ApiOkResponse({
    type: DownloadUrlDto,
    description: '在 COS 配置时长内有效的下载地址',
  })
  createDownloadUrl(@Body() dto: CreateDownloadUrlDto): DownloadUrlDto {
    return this.cosService.createDownloadUrl(dto);
  }
}
