import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户信息 DTO —— `/user/me` 返回，覆盖 User 表全字段
 * class 而非 interface：swagger 需要运行时反射生成 spec
 */
export class PublicUserDto {
  @ApiProperty({ type: Number, description: '用户主键 id', example: 1 })
  id!: number;

  @ApiProperty({ type: Number, description: '所属认证 id', example: 1 })
  authId!: number;

  @ApiProperty({
    type: String,
    description: '用户昵称，全局唯一',
    example: 'alice',
  })
  name!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: '头像 URL，未设置为 null',
    example: 'https://cdn.example.com/a.png',
  })
  avatar!: string | null;

  @ApiProperty({
    type: Object,
    description: '用户资料（性别、生日、地区、个签等），JSON 对象',
    example: {},
  })
  data!: Record<string, unknown>;

  @ApiProperty({
    type: Object,
    description: '用户偏好设置（主题、语言、通知等），JSON 对象',
    example: {},
  })
  settings!: Record<string, unknown>;

  @ApiProperty({ type: String, format: 'date-time', description: '更新时间' })
  updatedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time', description: '创建时间' })
  createdAt!: Date;
}
