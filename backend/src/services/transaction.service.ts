import { Decimal } from "@prisma/client/runtime/library";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../middleware/error.middleware";
import { walletService } from "./wallet.service";
import { generateReference, calculatePagination } from "../utils/helpers";
import { fraudService } from "./fraud.service";

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

export class TransactionService {
  async transfer(data: TransferData) {
    // Verify PIN
    const isPinValid = await walletService.verifyWalletPin(
      data.senderId,
      data.pin
    );
    if (!isPinValid) {
      throw new AppError("Invalid PIN", 401);
    }

    // Check sender wallet
    const senderWallet = await prisma.wallet.findUnique({
      where: { userId: data.senderId },
    });

    if (!senderWallet || Number(senderWallet.balance) < data.amount) {
      throw new AppError("Insufficient balance", 400);
    }

    // Check receiver exists
    const receiverWallet = await prisma.wallet.findUnique({
      where: { userId: data.receiverId },
    });

    if (!receiverWallet) {
      throw new AppError("Receiver not found", 404);
    }

    // Check fraud
    const fraudScore = await fraudService.calculateFraudScore({
      userId: data.senderId,
      amount: data.amount,
      type: "TRANSFER",
    });

    if (fraudScore > 0.8) {
      throw new AppError("Transaction flagged for review", 403);
    }

    // Execute transaction
    const transaction = await prisma.$transaction(async (tx: any) => {
      // Deduct from sender
      await tx.wallet.update({
        where: { userId: data.senderId },
        data: { balance: { decrement: data.amount } },
      });

      // Add to receiver
      await tx.wallet.update({
        where: { userId: data.receiverId },
        data: { balance: { increment: data.amount } },
      });

      // Create transaction record
      return tx.transaction.create({
        data: {
          amount: new Decimal(data.amount),
          type: TransactionType.TRANSFER,
          status: TransactionStatus.COMPLETED,
          description: data.description || "Transfer",
          reference: generateReference(),
          senderId: data.senderId,
          receiverId: data.receiverId,
          fraudScore,
          isFlagged: fraudScore > 0.5,
        },
        include: {
          sender: { select: { name: true, email: true } },
          receiver: { select: { name: true, email: true } },
        },
      });
    });

    return {
      id: transaction.id,
      reference: transaction.reference,
      amount: Number(transaction.amount),
      status: transaction.status,
      receiver: transaction.receiver?.name,
      createdAt: transaction.createdAt,
    };
  }

  async payMerchant(data: PaymentData) {
    // Find merchant by code
    const merchant = await prisma.user.findUnique({
      where: { merchantCode: data.merchantCode },
      include: { wallet: true },
    });

    if (!merchant || merchant.role !== "MERCHANT") {
      throw new AppError("Merchant not found", 404);
    }

    return this.transfer({
      senderId: data.senderId,
      receiverId: merchant.id,
      amount: data.amount,
      pin: data.pin,
      description: `Payment to ${merchant.merchantName}`,
    });
  }

  async getTransaction(transactionId: string, userId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
      },
    });

    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    if (transaction.senderId !== userId && transaction.receiverId !== userId) {
      throw new AppError("Access denied", 403);
    }

    return {
      id: transaction.id,
      reference: transaction.reference,
      amount: Number(transaction.amount),
      type: transaction.type,
      status: transaction.status,
      description: transaction.description,
      sender: transaction.sender,
      receiver: transaction.receiver,
      createdAt: transaction.createdAt,
    };
  }

  async getTransactionHistory(
    userId: string,
    options: { page: number; limit: number; type?: TransactionType }
  ) {
    const { page = 1, limit = 20, type } = options;
    const skip = (page - 1) * limit;

    const where = {
      OR: [{ senderId: userId }, { receiverId: userId }],
      ...(type && { type }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          sender: { select: { name: true } },
          receiver: { select: { name: true, merchantName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions.map((t: any) => ({
        id: t.id,
        reference: t.reference,
        amount: Number(t.amount),
        type: t.type,
        status: t.status,
        description: t.description,
        isCredit: t.receiverId === userId,
        counterparty:
          t.senderId === userId
            ? t.receiver?.merchantName || t.receiver?.name
            : t.sender?.name,
        createdAt: t.createdAt,
      })),
      pagination: calculatePagination(page, limit, total),
    };
  }
}

export const transactionService = new TransactionService();
