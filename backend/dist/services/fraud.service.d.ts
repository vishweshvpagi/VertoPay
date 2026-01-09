interface FraudCheckData {
    userId: string;
    amount: number;
    type: string;
}
export declare class FraudService {
    calculateFraudScore(data: FraudCheckData): Promise<number>;
    getFlaggedTransactions(page?: number, limit?: number): Promise<{
        data: ({
            sender: {
                email: string;
                name: string;
            } | null;
            receiver: {
                email: string;
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            receiverId: string | null;
            description: string | null;
            type: import(".prisma/client").$Enums.TransactionType;
            status: import(".prisma/client").$Enums.TransactionStatus;
            reference: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            fraudScore: number | null;
            isFlagged: boolean;
            senderId: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    reviewTransaction(transactionId: string, approved: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        receiverId: string | null;
        description: string | null;
        type: import(".prisma/client").$Enums.TransactionType;
        status: import(".prisma/client").$Enums.TransactionStatus;
        reference: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        fraudScore: number | null;
        isFlagged: boolean;
        senderId: string | null;
    }>;
}
export declare const fraudService: FraudService;
export {};
//# sourceMappingURL=fraud.service.d.ts.map