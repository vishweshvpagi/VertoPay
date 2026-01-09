import { TransactionType } from "@prisma/client";
interface TransferData {
    senderId: string;
    receiverId: string;
    amount: number;
    pin: string;
    description?: string;
}
interface PaymentData {
    senderId: string;
    merchantCode: string;
    amount: number;
    pin: string;
    description?: string;
}
export declare class TransactionService {
    transfer(data: TransferData): Promise<{
        id: any;
        reference: any;
        amount: number;
        status: any;
        receiver: any;
        createdAt: any;
    }>;
    payMerchant(data: PaymentData): Promise<{
        id: any;
        reference: any;
        amount: number;
        status: any;
        receiver: any;
        createdAt: any;
    }>;
    getTransaction(transactionId: string, userId: string): Promise<{
        id: string;
        reference: string;
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
        status: import(".prisma/client").$Enums.TransactionStatus;
        description: string | null;
        sender: {
            email: string;
            name: string;
        } | null;
        receiver: {
            email: string;
            name: string;
        } | null;
        createdAt: Date;
    }>;
    getTransactionHistory(userId: string, options: {
        page: number;
        limit: number;
        type?: TransactionType;
    }): Promise<{
        data: {
            id: any;
            reference: any;
            amount: number;
            type: any;
            status: any;
            description: any;
            isCredit: boolean;
            counterparty: any;
            createdAt: any;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
export declare const transactionService: TransactionService;
export {};
//# sourceMappingURL=transaction.service.d.ts.map