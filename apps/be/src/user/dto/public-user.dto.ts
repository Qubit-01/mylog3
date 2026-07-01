import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户公开信息 DTO —— 用于注册、登录、获取当前用户等接口的返回
 * class 而非 interface：swagger 需要运行时反射生成 spec
 */
export class PublicUserDto {
  @ApiProperty({ type: Number, description: '用户主键 id', example: 1 })
  id!: number;

  @ApiProperty({ type: String, description: '用户昵称', example: 'alice' })
  name!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: '头像 URL，未设置为 null',
    example: 'https://cdn.example.com/a.png',
  })
  avatar!: string | null;
}
