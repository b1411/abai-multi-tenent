import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Paginate = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const { page, limit, sortBy, order } = request.query;

        return {
            page: parseInt(page as string, 10) || 1,
            limit: parseInt(limit as string, 10) || 10,
            sortBy: sortBy as string || 'id',
            order: (order as 'asc' | 'desc') || 'asc',
        };
    },
);