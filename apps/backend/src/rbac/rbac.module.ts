import { Global, Module } from '@nestjs/common';
import { RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';
import { PermissionService } from './permission.service';
import { RoleService } from './role.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../jwt/jwt.service';

@Global()
@Module({
  controllers: [RbacController],
  providers: [
    RbacService,
    PermissionService,
    RoleService,
    PrismaService,
    JwtService,
  ],
  exports: [RbacService, PermissionService, RoleService, JwtService],
})
export class RbacModule {}
