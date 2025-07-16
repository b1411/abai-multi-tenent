export type JwtPayload = {
    id: number;
    email: string;
    name: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'HR' | 'FINANCIST';
}