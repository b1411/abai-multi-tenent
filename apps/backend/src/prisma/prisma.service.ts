import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';
import { withAccelerate } from "@prisma/extension-accelerate"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        await this.$extends(withAccelerate()).$connect();
    }
}
