export const DEFAULT_RATE_DKK_TO_EUR = 0.134;

export type ExchangeRatePayload = {
  pair: string;
  rate: number;
  updatedAt: string;
};

export const fetchLatestRate = async (): Promise<ExchangeRatePayload> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    pair: 'DKK_EUR',
    rate: DEFAULT_RATE_DKK_TO_EUR,
    updatedAt: new Date().toISOString(),
  };
};

export const convertWithPair = (
  amount: number,
  from: string,
  to: string,
  dkkToEurRate: number,
): number => {
  if (from === to) {
    return amount;
  }

  if (from === 'DKK' && to === 'EUR') {
    return amount * dkkToEurRate;
  }

  if (from === 'EUR' && to === 'DKK') {
    return amount / dkkToEurRate;
  }

  return amount;
};
