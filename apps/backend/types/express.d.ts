import { IncomingHttpHeaders } from 'http';

declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
        headers: IncomingHttpHeaders;
    }
}
