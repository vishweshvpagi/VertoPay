import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/db';
import { AppError } from '../middleware/error.middleware';
import { hashPin, verifyPin } from '../utils/encryption';

export class WalletService {
  async getWallet(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });
    
    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }
    
    return {
      id: wallet.id,
      balance: Number(wallet.balance),
      dailyLimit: Number(wallet.dailyLimit),
      monthlyLimit: Number(wallet.monthlyLimit),
      isLocked: wallet.isLocked,
      hasPin: !!wallet.pin,
    };
  }
  
  async setPin(userId: string, pin: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });
    
    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }
    
    await prisma.wallet.update({
      where: { userId },
      data: { pin: hashPin(pin) },
    });
    
    return { message: 'PIN set successfully' };
  }
  
  async verifyWalletPin(userId: string, pin: string): Promise<boolean> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });
    
    if (!wallet || !wallet.pin) {
      throw new AppError('Wallet PIN not set', 400);
    }
    
    if (wallet.isLocked) {
      throw new AppError('Wallet is locked', 403);
    }
    
    return verifyPin(pin, wallet.pin);
  }
  
  async topUp(userId: string, amount: number, pin: string) {
    const isValid = await this.verifyWalletPin(userId, pin);
    
    if (!isValid) {
      throw new AppError('Invalid PIN', 401);
    }
    
    const wallet = await prisma.wallet.update({
      where: { userId },
      data: {
        balance: { increment: amount },
      },
    });
    
    // Create transaction record
    await prisma.transaction.create({
      data: {
        amount: new Decimal(amount),
        type: 'CREDIT',
        status: 'COMPLETED',
        description: 'Wallet top-up',
        receiverId: userId,
      },
    });
    
    return {
      balance: Number(wallet.balance),
      message: 'Top-up successful',
    };
  }
  
  async lockWallet(userId: string) {
    await prisma.wallet.update({
      where: { userId },
      data: { isLocked: true },
    });
    
    return { message: 'Wallet locked successfully' };
  }
  
  async unlockWallet(userId: string, pin: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });
    
    if (!wallet || !wallet.pin) {
      throw new AppError('Wallet not found', 404);
    }
    
    if (!verifyPin(pin, wallet.pin)) {
      throw new AppError('Invalid PIN', 401);
    }
    
    await prisma.wallet.update({
      where: { userId },
      data: { isLocked: false },
    });
    
    return { message: 'Wallet unlocked successfully' };
  }
}

export const walletService = new WalletService();