export type SupportedCurrency = string;

export type ExchangeRatesPayload = {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
};

type FrankfurterLatestResponse = {
  amount?: number;
  base?: string;
  date?: string;
  rates?: Record<string, number>;
};

const RATES_ENDPOINT = 'https://api.frankfurter.app/latest';

const isValidRatesMap = (value: unknown): value is Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((rate) => typeof rate === 'number' && Number.isFinite(rate) && rate > 0);
};

const toUpdatedAt = (date: string | undefined) => {
  if (!date) {
    return new Date().toISOString();
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
};

export const fetchLatestRates = async (): Promise<ExchangeRatesPayload> => {
  const response = await fetch(RATES_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Rates request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as FrankfurterLatestResponse;
  if (!payload.base || typeof payload.base !== 'string') {
    throw new Error('Rates response is missing a valid base currency');
  }

  if (!isValidRatesMap(payload.rates) || Object.keys(payload.rates).length === 0) {
    throw new Error('Rates response is missing a valid rates map');
  }

  return {
    base: payload.base,
    rates: payload.rates,
    updatedAt: toUpdatedAt(payload.date),
  };
};

export const getSupportedCurrencies = (payload: ExchangeRatesPayload): SupportedCurrency[] => {
  const others = Object.keys(payload.rates)
    .filter((currency) => currency !== payload.base)
    .sort((left, right) => left.localeCompare(right));

  return [payload.base, ...others];
};

const getRateForCurrency = (currency: string, payload: ExchangeRatesPayload) => {
  if (currency === payload.base) {
    return 1;
  }

  return payload.rates[currency];
};

export const convertWithRates = (
  amount: number,
  from: string,
  to: string,
  payload: ExchangeRatesPayload,
): number => {
  if (!Number.isFinite(amount)) {
    return Number.NaN;
  }

  if (from === to) {
    return amount;
  }

  const fromRate = getRateForCurrency(from, payload);
  const toRate = getRateForCurrency(to, payload);

  if (!fromRate || !toRate) {
    return Number.NaN;
  }

  const amountInBase = from === payload.base ? amount : amount / fromRate;
  const result = to === payload.base ? amountInBase : amountInBase * toRate;

  return Number.isFinite(result) ? result : Number.NaN;
};

export const getPairRate = (
  from: string,
  to: string,
  payload: ExchangeRatesPayload,
): number | null => {
  const rate = convertWithRates(1, from, to, payload);
  return Number.isFinite(rate) ? rate : null;
};
