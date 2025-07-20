import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (property: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    if (property) {
      // Возвращаем конкретное свойство пользователя
      switch (property) {
        case 'studentId':
          return user.student?.id;
        case 'teacherId':
          return user.teacher?.id;
        case 'parentId':
          return user.parent?.id;
        default:
          return user[property];
      }
    }

    return user;
  },
);
