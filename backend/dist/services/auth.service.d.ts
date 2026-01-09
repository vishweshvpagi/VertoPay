import { Role } from "@prisma/client";
interface RegisterData {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: Role;
    merchantName?: string;
}
interface LoginData {
    email: string;
    password: string;
}
export declare class AuthService {
    register(data: RegisterData): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            merchantCode: string | null;
        };
        token: string;
    }>;
    login(data: LoginData): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            merchantCode: string | null;
            wallet: {
                balance: number;
                isLocked: boolean;
            } | null;
        };
        token: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        merchantName: string | null;
        merchantCode: string | null;
        wallet: {
            balance: number;
            dailyLimit: number;
            isLocked: boolean;
            hasPin: boolean;
        } | null;
    }>;
    private generateToken;
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=auth.service.d.ts.map