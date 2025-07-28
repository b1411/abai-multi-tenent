import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface PermissionGuardProps {
  children: React.ReactNode;
  module: string;
  action: string;
  resource?: string;
  scope?: string;
  fallback?: React.ReactNode;
  requireAll?: boolean; // Требовать все разрешения или любое
  permissions?: Array<{
    module: string;
    action: string;
    resource?: string;
    scope?: string;
  }>;
}

/**
 * Компонент для условного рендеринга на основе разрешений RBAC
 * 
 * @example
 * // Простая проверка одного разрешения
 * <PermissionGuard module="students" action="read">
 *   <StudentsTable />
 * </PermissionGuard>
 * 
 * @example
 * // Проверка с областью видимости
 * <PermissionGuard module="students" action="update" scope="OWN">
 *   <EditStudentButton />
 * </PermissionGuard>
 * 
 * @example
 * // Проверка множественных разрешений (любое)
 * <PermissionGuard permissions={[
 *   { module: 'students', action: 'create' },
 *   { module: 'admin', action: 'all' }
 * ]}>
 *   <CreateStudentButton />
 * </PermissionGuard>
 * 
 * @example
 * // Проверка множественных разрешений (все)
 * <PermissionGuard 
 *   permissions={[
 *     { module: 'students', action: 'read' },
 *     { module: 'reports', action: 'read' }
 *   ]}
 *   requireAll={true}
 *   fallback={<div>Недостаточно прав</div>}
 * >
 *   <StudentReportsButton />
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  module,
  action,
  resource,
  scope,
  fallback = null,
  requireAll = false,
  permissions
}) => {
  const { hasPermission, hasAnyPermission, userPermissions } = useAuth();

  let hasAccess = false;

  if (permissions && permissions.length > 0) {
    // Проверка множественных разрешений
    if (requireAll) {
      // Требуем все разрешения
      hasAccess = permissions.every(perm => 
        hasPermission(perm.module, perm.action, {
          resource: perm.resource,
          scope: perm.scope
        })
      );
    } else {
      // Достаточно любого разрешения
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    // Проверка одного разрешения
    hasAccess = hasPermission(module, action, { resource, scope });
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * HOC для обертки компонентов с проверкой разрешений
 */
export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  permissionConfig: {
    module: string;
    action: string;
    resource?: string;
    scope?: string;
    fallback?: React.ReactNode;
  }
) => {
  return (props: P) => (
    <PermissionGuard
      module={permissionConfig.module}
      action={permissionConfig.action}
      resource={permissionConfig.resource}
      scope={permissionConfig.scope}
      fallback={permissionConfig.fallback}
    >
      <Component {...props} />
    </PermissionGuard>
  );
};

/**
 * Хук для проверки разрешений с дополнительной логикой
 */
export const usePermissions = () => {
  const { hasPermission, hasAnyPermission, userPermissions, userRoles } = useAuth();

  const canAccess = React.useCallback((
    module: string,
    action: string,
    options?: {
      resource?: string;
      scope?: string;
      ownerId?: number;
      groupId?: number;
    }
  ) => {
    return hasPermission(module, action, {
      resource: options?.resource,
      scope: options?.scope
    });
  }, [hasPermission]);

  const canAccessAny = React.useCallback((
    permissions: Array<{
      module: string;
      action: string;
      resource?: string;
      scope?: string;
    }>
  ) => {
    return hasAnyPermission(permissions);
  }, [hasAnyPermission]);

  const canManageUser = React.useCallback((targetUserId: number, currentUserId: number) => {
    // Админы могут управлять всеми
    if (hasPermission('users', 'update')) {
      return true;
    }
    
    // Пользователи могут управлять только собой
    if (hasPermission('users', 'update', { scope: 'OWN' })) {
      return targetUserId === currentUserId;
    }
    
    return false;
  }, [hasPermission]);

  const canViewStudentData = React.useCallback((studentId?: number, currentUserId?: number) => {
    // Админы и учителя видят всех
    if (hasPermission('students', 'read')) {
      return true;
    }
    
    // Родители видят своих детей
    if (hasPermission('students', 'read', { scope: 'ASSIGNED' })) {
      return true; // Логика проверки связи родитель-ребенок должна быть в API
    }
    
    // Студенты видят только себя
    if (hasPermission('students', 'read', { scope: 'OWN' })) {
      return studentId === currentUserId;
    }
    
    return false;
  }, [hasPermission]);

  const getMaxPermissionScope = React.useCallback((module: string, action: string): string | null => {
    const relevantPermissions = userPermissions.filter(p => 
      (p.module === module || p.module === '*') && 
      (p.action === action || p.action === '*')
    );

    if (relevantPermissions.length === 0) return null;

    // Определяем максимальную область доступа
    const scopes = relevantPermissions.map(p => p.scope);
    
    if (scopes.includes('ALL')) return 'ALL';
    if (scopes.includes('DEPARTMENT')) return 'DEPARTMENT';
    if (scopes.includes('GROUP')) return 'GROUP';
    if (scopes.includes('ASSIGNED')) return 'ASSIGNED';
    if (scopes.includes('OWN')) return 'OWN';
    
    return null;
  }, [userPermissions]);

  return {
    canAccess,
    canAccessAny,
    canManageUser,
    canViewStudentData,
    getMaxPermissionScope,
    userPermissions,
    userRoles
  };
};

export default PermissionGuard;
