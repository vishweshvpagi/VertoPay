import { v4 as uuidv4 } from 'uuid';

export function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = uuidv4().split('-')[0].toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

export function generateMerchantCode(): string {
  const random = uuidv4().split('-')[0].toUpperCase();
  return `MER-${random}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export function calculatePagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}