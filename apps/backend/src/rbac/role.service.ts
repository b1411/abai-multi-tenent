import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
}

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  /**
   * Создает новую роль
   */
  async createRole(data: CreateRoleDto) {
    // Проверяем уникальность имени роли
    const existingRole = await this.prisma.role.findUnique({
      where: { name: data.name }
    });

    if (existingRole) {
      throw new BadRequestException('Role with this name already exists');
    }

    // Создаем роль в транзакции
    return await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: data.name,
          description: data.description,
          isSystem: false,
          isActive: true
        }
      });

      // Добавляем разрешения к роли
      if (data.permissions && data.permissions.length > 0) {
        // Получаем актуальные ID разрешений
        const permissionIds = await this.resolvePermissionIds(data.permissions, tx);
        
        const rolePermissions = permissionIds.map(permissionId => ({
          roleId: role.id,
          permissionId
        }));

        await tx.rolePermission.createMany({
          data: rolePermissions
        });
      }

      // Получаем роль в том же контексте транзакции
      const createdRole = await tx.role.findUnique({
        where: { id: role.id },
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          },
          userRoles: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!createdRole) {
        throw new NotFoundException('Created role not found');
      }

      return {
        id: createdRole.id,
        name: createdRole.name,
        description: createdRole.description,
        isSystem: createdRole.isSystem,
        isActive: createdRole.isActive,
        permissions: createdRole.rolePermissions.map(rp => ({
          id: rp.permission.id,
          module: rp.permission.module,
          action: rp.permission.action,
          resource: rp.permission.resource,
          scope: rp.permission.scope,
          description: rp.permission.description
        })),
        assignedUsers: createdRole.userRoles.map(ur => ({
          id: ur.user.id,
          name: `${ur.user.name} ${ur.user.surname}`,
          email: ur.user.email,
          assignedAt: ur.assignedAt,
          expiresAt: ur.expiresAt,
          context: ur.context
        })),
        createdAt: createdRole.createdAt,
        updatedAt: createdRole.updatedAt
      };
    });
  }

  /**
   * Обновляет роль
   */
  async updateRole(id: string, data: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: { id }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system role');
    }

    // Проверяем уникальность имени, если оно изменяется
    if (data.name && data.name !== role.name) {
      const existingRole = await this.prisma.role.findUnique({
        where: { name: data.name }
      });

      if (existingRole) {
        throw new BadRequestException('Role with this name already exists');
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      // Обновляем роль
      await tx.role.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          updatedAt: new Date()
        }
      });

      // Обновляем разрешения, если они переданы
      if (data.permissions !== undefined) {
        // Удаляем старые разрешения
        await tx.rolePermission.deleteMany({
          where: { roleId: id }
        });

        // Добавляем новые разрешения
        if (data.permissions.length > 0) {
          // Получаем актуальные ID разрешений
          const permissionIds = await this.resolvePermissionIds(data.permissions, tx);
          
          const rolePermissions = permissionIds.map(permissionId => ({
            roleId: id,
            permissionId
          }));

          await tx.rolePermission.createMany({
            data: rolePermissions
          });
        }
      }

      return this.getRoleById(id);
    });
  }

  /**
   * Удаляет роль (мягкое удаление)
   */
  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system role');
    }

    // Проверяем, не назначена ли роль пользователям
    const assignedUsers = await this.prisma.userRoleAssignment.count({
      where: {
        roleId: id,
        isActive: true
      }
    });

    if (assignedUsers > 0) {
      throw new BadRequestException(
        `Cannot delete role: it is assigned to ${assignedUsers} user(s)`
      );
    }

    return await this.prisma.role.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false
      }
    });
  }

  /**
   * Получает роль по ID
   */
  async getRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        module: rp.permission.module,
        action: rp.permission.action,
        resource: rp.permission.resource,
        scope: rp.permission.scope,
        description: rp.permission.description
      })),
      assignedUsers: role.userRoles.map(ur => ({
        id: ur.user.id,
        name: `${ur.user.name} ${ur.user.surname}`,
        email: ur.user.email,
        assignedAt: ur.assignedAt,
        expiresAt: ur.expiresAt,
        context: ur.context
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    };
  }

  /**
   * Получает все роли
   */
  async getAllRoles(includeInactive = false) {
    const where = includeInactive ? {} : {
      deletedAt: null,
      isActive: true
    };

    const roles = await this.prisma.role.findMany({
      where,
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            userRoles: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: [
        { isSystem: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      permissionCount: role.rolePermissions.length,
      userCount: role._count.userRoles,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }));
  }

  /**
   * Добавляет разрешение к роли
   */
  async addPermissionToRole(roleId: string, permissionId: string, conditions?: any) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId }
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Проверяем, нет ли уже такого разрешения у роли
    const existingRolePermission = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId
        }
      }
    });

    if (existingRolePermission) {
      throw new BadRequestException('Permission already assigned to role');
    }

    return await this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
        conditions: conditions ? JSON.stringify(conditions) : null
      },
      include: {
        permission: true
      }
    });
  }

  /**
   * Удаляет разрешение у роли
   */
  async removePermissionFromRole(roleId: string, permissionId: string) {
    const rolePermission = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId
        }
      }
    });

    if (!rolePermission) {
      throw new NotFoundException('Permission not assigned to role');
    }

    await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId
        }
      }
    });

    return { message: 'Permission removed from role' };
  }

  /**
   * Получает пользователей с определенной ролью
   */
  async getUsersByRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const userRoles = await this.prisma.userRoleAssignment.findMany({
      where: {
        roleId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        assigner: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true
          }
        }
      }
    });

    return userRoles.map(ur => ({
      user: {
        id: ur.user.id,
        name: `${ur.user.name} ${ur.user.surname}`,
        email: ur.user.email,
        role: ur.user.role,
        createdAt: ur.user.createdAt
      },
      assignedBy: ur.assigner ? {
        id: ur.assigner.id,
        name: `${ur.assigner.name} ${ur.assigner.surname}`,
        email: ur.assigner.email
      } : null,
      assignedAt: ur.assignedAt,
      expiresAt: ur.expiresAt,
      context: ur.context
    }));
  }

  /**
   * Активирует/деактивирует роль
   */
  async toggleRoleStatus(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system role status');
    }

    return await this.prisma.role.update({
      where: { id },
      data: {
        isActive: !role.isActive,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Преобразует идентификаторы разрешений (UUID или строковые) в UUID
   */
  private async resolvePermissionIds(permissionIds: string[], tx?: any): Promise<string[]> {
    const prisma = tx || this.prisma;
    const resolvedIds: string[] = [];

    for (const permissionId of permissionIds) {
      // Проверяем, является ли это UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(permissionId);
      
      if (isUuid) {
        // Это уже UUID, проверяем что разрешение существует
        const permission = await prisma.permission.findUnique({
          where: { id: permissionId }
        });
        
        if (permission) {
          resolvedIds.push(permissionId);
        }
      } else {
        // Это строковый идентификатор в формате "module-action-scope"
        const parts = permissionId.split('-');
        if (parts.length >= 3) {
          const module = parts[0];
          const action = parts[1];
          const scope = parts.slice(2).join('-'); // На случай если в scope есть дефисы
          
          // Проверяем, что scope является валидным значением enum PermissionScope
          const validScopes = ['ALL', 'OWN', 'GROUP', 'DEPARTMENT', 'ASSIGNED'];
          if (!validScopes.includes(scope)) {
            console.warn(`Invalid permission scope: ${scope} for permission: ${permissionId}`);
            continue;
          }
          
          const permission = await prisma.permission.findFirst({
            where: {
              module,
              action,
              scope: scope as any // Приводим к enum PermissionScope
            }
          });
          
          if (permission) {
            resolvedIds.push(permission.id);
          } else {
            console.warn(`Permission not found: module=${module}, action=${action}, scope=${scope}`);
          }
        } else {
          console.warn(`Invalid permission format: ${permissionId}. Expected format: module-action-scope`);
        }
      }
    }

    return resolvedIds;
  }
}
