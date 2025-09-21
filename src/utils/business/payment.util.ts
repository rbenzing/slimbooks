import { PaymentMethod, PaymentStatus } from '@/types';

export const getPaymentMethodDisplayName = (method: PaymentMethod): string => {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'check':
      return 'Check';
    case 'credit_card':
      return 'Credit Card';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'paypal':
      return 'PayPal';
    case 'stripe':
      return 'Stripe';
    case 'other':
      return 'Other';
    default:
      return method;
  }
};

export const getPaymentStatusDisplayName = (status: PaymentStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case 'pending':
      return 'yellow';
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    case 'cancelled':
      return 'gray';
    case 'refunded':
      return 'blue';
    default:
      return 'gray';
  }
};

export const getPaymentMethodIcon = (method: PaymentMethod): string => {
  switch (method) {
    case 'cash':
      return 'DollarSign';
    case 'check':
      return 'FileText';
    case 'credit_card':
      return 'CreditCard';
    case 'bank_transfer':
      return 'Building2';
    case 'paypal':
      return 'Wallet';
    case 'stripe':
      return 'CreditCard';
    case 'other':
      return 'HelpCircle';
    default:
      return 'HelpCircle';
  }
};

export const validatePaymentAmount = (amount: number, maxAmount?: number): {
  isValid: boolean;
  error?: string;
} => {
  if (amount <= 0) {
    return { isValid: false, error: 'Payment amount must be greater than zero' };
  }

  if (maxAmount && amount > maxAmount) {
    return { isValid: false, error: `Payment amount cannot exceed ${maxAmount}` };
  }

  return { isValid: true };
};

export const calculatePaymentFee = (
  amount: number,
  method: PaymentMethod,
  feeSettings?: { [key in PaymentMethod]?: number }
): number => {
  if (!feeSettings || !feeSettings[method]) {
    return 0;
  }

  const feeRate = feeSettings[method] || 0;
  return amount * (feeRate / 100);
};