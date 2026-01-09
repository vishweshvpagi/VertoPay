import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { AppError } from "../middleware/error.middleware";
import { generateMerchantCode } from "../utils/helpers";

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

export class AuthService {
  async register(data: RegisterData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError("Email already registered", 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        role: data.role || Role.STUDENT,
        merchantName: data.role === Role.MERCHANT ? data.merchantName : null,
        merchantCode:
          data.role === Role.MERCHANT ? generateMerchantCode() : null,
        wallet: {
          create: {
            balance: 0,
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        merchantCode: user.merchantCode,
      },
      token,
    };
  }

  async login(data: LoginData) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { wallet: true },
    });

    if (!user || !user.isActive) {
      throw new AppError("Invalid credentials", 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        merchantCode: user.merchantCode,
        wallet: user.wallet
          ? {
              balance: Number(user.wallet.balance),
              isLocked: user.wallet.isLocked,
            }
          : null,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      merchantName: user.merchantName,
      merchantCode: user.merchantCode,
      wallet: user.wallet
        ? {
            balance: Number(user.wallet.balance),
            dailyLimit: Number(user.wallet.dailyLimit),
            isLocked: user.wallet.isLocked,
            hasPin: !!user.wallet.pin,
          }
        : null,
    };
  }

  private generateToken(userId: string, email: string, role: Role): string {
    const options: jwt.SignOptions = {
      expiresIn: env.jwt.expiresIn as any,
    };
    return jwt.sign({ userId, email, role }, env.jwt.secret as string, options);
  }
}

export const authService = new AuthService();
