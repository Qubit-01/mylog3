import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUserDto } from './dto/public-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /** 根据 id 拉用户公开信息，不存在则 404 */
  async findPublicById(id: number): Promise<PublicUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    return { id: user.id, name: user.name, avatar: user.avatar };
  }
}
