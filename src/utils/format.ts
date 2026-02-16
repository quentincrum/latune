export const formatAmount = (amount: number): string => {
  if (!Number.isFinite(amount)) {
    return '0.00';
  }
  return amount.toFixed(2);
};

export const nowTimestamp = (): string => {
  return new Date().toLocaleString();
};
