export declare class WalletService {
    getWallet(userId: string): Promise<{
        id: string;
        balance: number;
        dailyLimit: number;
        monthlyLimit: number;
        isLocked: boolean;
        hasPin: boolean;
    }>;
    setPin(userId: string, pin: string): Promise<{
        message: string;
    }>;
    verifyWalletPin(userId: string, pin: string): Promise<boolean>;
    topUp(userId: string, amount: number, pin: string): Promise<{
        balance: number;
        message: string;
    }>;
    lockWallet(userId: string): Promise<{
        message: string;
    }>;
    unlockWallet(userId: string, pin: string): Promise<{
        message: string;
    }>;
}
export declare const walletService: WalletService;
//# sourceMappingURL=wallet.service.d.ts.map