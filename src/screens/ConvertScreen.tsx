import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmountRow } from '../components/AmountRow';
import { Keypad } from '../components/Keypad';
import {
  convertWithRates,
  ExchangeRatesPayload,
  fetchLatestRates,
  getPairRate,
  getSupportedCurrencies,
} from '../services/rates';
import { theme } from '../theme/theme';
import { Currency } from '../types/currency';
import { formatAmount, nowTimestamp } from '../utils/format';
import {
  formatExpressionValue,
  getLastNumberSegment,
  isInProgressExpression,
  isCalculatorOperator,
  tryEvaluate,
} from '../utils/calc';
import { CurrencyPickerModal } from './CurrencyPickerModal';

const CURRENCY_METADATA: Record<string, Currency> = {
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  BGN: { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'Pound Sterling' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  HUF: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  ISK: { code: 'ISK', symbol: 'kr', name: 'Icelandic Króna' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  RON: { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
};

type PickerTarget = 'from' | 'to' | null;
type ActiveCard = 'from' | 'to';

const MINUS = '−';

const formatForDisplay = (value: number) => formatExpressionValue(value).replace('-', MINUS);

const endsWithOperator = (value: string) => {
  if (!value) {
    return false;
  }

  return isCalculatorOperator(value[value.length - 1]);
};

const getNextExpression = (current: string, token: string) => {
  let next = current;

  if (/^\d$/.test(token)) {
    if (current === '0') {
      return token;
    }

    if (current === `${MINUS}0` && token !== '0') {
      return `${MINUS}${token}`;
    }

    return `${current}${token}`;
  }

  if (token === '.') {
    if (current === '0') {
      return '0.';
    }

    if (current === MINUS) {
      return `${MINUS}0.`;
    }

    if (endsWithOperator(current)) {
      return `${current}0.`;
    }

    const lastSegment = getLastNumberSegment(current);
    if (lastSegment.includes('.')) {
      return current;
    }

    return `${current}.`;
  }

  if (isCalculatorOperator(token)) {
    if (current === '0' && token === MINUS) {
      return MINUS;
    }

    if (current === MINUS) {
      return current;
    }

    if (endsWithOperator(current)) {
      const lastChar = current[current.length - 1];
      if (token === MINUS && lastChar !== MINUS) {
        return `${current}${token}`;
      }

      return `${current.slice(0, -1)}${token}`;
    }

    return `${current}${token}`;
  }

  return next;
};

const getFallbackSelection = (currencies: Currency[], preferredCode?: string) => {
  if (currencies.length === 0) {
    return '';
  }

  if (preferredCode && currencies.some((currency) => currency.code === preferredCode)) {
    return preferredCode;
  }

  return currencies[0].code;
};

const getSecondarySelection = (currencies: Currency[], primaryCode: string) => {
  const alternate = currencies.find((currency) => currency.code !== primaryCode);
  return alternate ? alternate.code : primaryCode;
};

export const ConvertScreen = () => {
  const [ratesPayload, setRatesPayload] = useState<ExchangeRatesPayload | null>(null);
  const [fromCurrency, setFromCurrency] = useState('');
  const [toCurrency, setToCurrency] = useState('');
  const [activeCard, setActiveCard] = useState<ActiveCard>('from');
  const [fromExpression, setFromExpression] = useState('0');
  const [toExpression, setToExpression] = useState('0');
  const [fromValidValue, setFromValidValue] = useState(0);
  const [toValidValue, setToValidValue] = useState(0);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(nowTimestamp());
  const [rateError, setRateError] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pendingSelection, setPendingSelection] = useState('');
  const insets = useSafeAreaInsets();

  const supportedCurrencies = useMemo(() => {
    if (!ratesPayload) {
      return [] as Currency[];
    }

    return getSupportedCurrencies(ratesPayload)
      .map((code) => CURRENCY_METADATA[code])
      .filter((currency): currency is Currency => Boolean(currency));
  }, [ratesPayload]);

  useEffect(() => {
    let mounted = true;

    const loadRates = async () => {
      try {
        const result = await fetchLatestRates();
        if (!mounted) {
          return;
        }

        setRatesPayload(result);
        setLastUpdated(new Date(result.updatedAt).toLocaleString());
        setRateError(null);
      } catch {
        if (!mounted) {
          return;
        }

        setRatesPayload(null);
        setRateError('Unable to load live exchange rates');
        setPickerVisible(false);
        setPickerTarget(null);
      }
    };

    loadRates();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (supportedCurrencies.length === 0) {
      setFromCurrency('');
      setToCurrency('');
      setPendingSelection('');
      return;
    }

    const nextFrom = getFallbackSelection(
      supportedCurrencies,
      fromCurrency || (ratesPayload ? ratesPayload.base : undefined),
    );
    const nextTo = toCurrency && supportedCurrencies.some((currency) => currency.code === toCurrency)
      ? toCurrency
      : getSecondarySelection(supportedCurrencies, nextFrom);

    if (fromCurrency !== nextFrom) {
      setFromCurrency(nextFrom);
    }

    if (toCurrency !== nextTo) {
      setToCurrency(nextTo);
    }

    if (!pendingSelection || !supportedCurrencies.some((currency) => currency.code === pendingSelection)) {
      setPendingSelection(nextFrom);
    }
  }, [fromCurrency, pendingSelection, ratesPayload, supportedCurrencies, toCurrency]);

  const softSyncValue = (target: ActiveCard, expression: string) => {
    if (isInProgressExpression(expression)) {
      return;
    }

    const evaluation = tryEvaluate(expression);
    if (!evaluation.ok) {
      return;
    }

    if (target === 'from') {
      setFromValidValue(evaluation.value);
    } else {
      setToValidValue(evaluation.value);
    }
  };

  const appendToken = (token: string) => {
    if (token === '( )' || token === '%') {
      return;
    }

    setCalcError(null);

    if (activeCard === 'from') {
      setFromExpression((current) => {
        if (isCalculatorOperator(token) && !isInProgressExpression(current)) {
          const currentEvaluation = tryEvaluate(current);
          if (!currentEvaluation.ok) {
            setCalcError('Invalid expression');
            return current;
          }
        }

        const next = getNextExpression(current, token);
        softSyncValue('from', next);
        return next;
      });
      return;
    }

    setToExpression((current) => {
      if (isCalculatorOperator(token) && !isInProgressExpression(current)) {
        const currentEvaluation = tryEvaluate(current);
        if (!currentEvaluation.ok) {
          setCalcError('Invalid expression');
          return current;
        }
      }

      const next = getNextExpression(current, token);
      softSyncValue('to', next);
      return next;
    });
  };

  const handleBackspace = () => {
    setCalcError(null);

    if (activeCard === 'from') {
      setFromExpression((current) => {
        const next = current.length <= 1 ? '0' : current.slice(0, -1);
        const normalized = next === MINUS || next === '' ? '0' : next;
        softSyncValue('from', normalized);
        return normalized;
      });
      return;
    }

    setToExpression((current) => {
      const next = current.length <= 1 ? '0' : current.slice(0, -1);
      const normalized = next === MINUS || next === '' ? '0' : next;
      softSyncValue('to', normalized);
      return normalized;
    });
  };

  const handleClear = () => {
    if (activeCard === 'from') {
      setFromExpression('0');
      setFromValidValue(0);
    } else {
      setToExpression('0');
      setToValidValue(0);
    }

    setCalcError(null);
  };

  const handleEquals = () => {
    const expression = activeCard === 'from' ? fromExpression : toExpression;
    const evaluation = tryEvaluate(expression);
    if (!evaluation.ok) {
      setCalcError('Invalid expression');
      return;
    }

    const normalized = formatForDisplay(evaluation.value);

    if (activeCard === 'from') {
      setFromExpression(normalized);
      setFromValidValue(evaluation.value);
    } else {
      setToExpression(normalized);
      setToValidValue(evaluation.value);
    }

    setCalcError(null);
  };

  const fromAmount = useMemo(() => {
    if (activeCard === 'from') {
      return formatAmount(fromValidValue);
    }

    if (!ratesPayload || !fromCurrency || !toCurrency) {
      return formatAmount(0);
    }

    const converted = convertWithRates(toValidValue, toCurrency, fromCurrency, ratesPayload);
    return formatAmount(converted);
  }, [activeCard, fromCurrency, fromValidValue, ratesPayload, toCurrency, toValidValue]);

  const toAmount = useMemo(() => {
    if (activeCard === 'to') {
      return formatAmount(toValidValue);
    }

    if (!ratesPayload || !fromCurrency || !toCurrency) {
      return formatAmount(0);
    }

    const converted = convertWithRates(fromValidValue, fromCurrency, toCurrency, ratesPayload);
    return formatAmount(converted);
  }, [activeCard, fromCurrency, fromValidValue, ratesPayload, toCurrency, toValidValue]);

  const rateText = useMemo(() => {
    if (!ratesPayload || !fromCurrency || !toCurrency) {
      return 'Rates unavailable';
    }

    if (fromCurrency === toCurrency) {
      return `1 ${fromCurrency} = 1 ${toCurrency}`;
    }

    const pairRate = getPairRate(fromCurrency, toCurrency, ratesPayload);
    if (pairRate === null) {
      return 'Rates unavailable';
    }

    return `1 ${fromCurrency} = ${pairRate.toFixed(4)} ${toCurrency}`;
  }, [fromCurrency, ratesPayload, toCurrency]);

  const openPicker = (target: Exclude<PickerTarget, null>) => {
    if (supportedCurrencies.length === 0) {
      return;
    }

    const currentCode = target === 'from' ? fromCurrency : toCurrency;
    const nextPendingSelection = getFallbackSelection(supportedCurrencies, currentCode);

    setPickerTarget(target);
    setPendingSelection(nextPendingSelection);
    setPickerVisible(true);
  };

  const confirmPicker = () => {
    if (!supportedCurrencies.some((currency) => currency.code === pendingSelection)) {
      setPickerVisible(false);
      setPickerTarget(null);
      return;
    }

    if (pickerTarget === 'from') {
      setFromCurrency(pendingSelection);
    }

    if (pickerTarget === 'to') {
      setToCurrency(pendingSelection);
    }

    setPickerVisible(false);
    setPickerTarget(null);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={[styles.content, { paddingBottom: theme.spacing.md + insets.bottom }]}>
        <AmountRow
          label="From"
          currencyCode={fromCurrency}
          amount={fromAmount}
          expression={activeCard === 'from' ? fromExpression : undefined}
          calcError={activeCard === 'from' ? calcError : null}
          onCurrencyPress={() => openPicker('from')}
          onPress={() => setActiveCard('from')}
          active={activeCard === 'from'}
        />

        <AmountRow
          label="To"
          currencyCode={toCurrency}
          amount={toAmount}
          expression={activeCard === 'to' ? toExpression : undefined}
          calcError={activeCard === 'to' ? calcError : null}
          onCurrencyPress={() => openPicker('to')}
          onPress={() => setActiveCard('to')}
          active={activeCard === 'to'}
        />

        <View style={styles.rateWrap}>
          <Text style={styles.rateText}>{rateText}</Text>
          <Text style={styles.subtleText}>Updated: {lastUpdated}</Text>
          {rateError ? <Text style={styles.errorText}>{rateError}</Text> : null}
        </View>

        <View style={styles.keypadWrap}>
          <Keypad onInput={appendToken} onBackspace={handleBackspace} onClear={handleClear} onEquals={handleEquals} />
        </View>
      </View>

      <CurrencyPickerModal
        visible={pickerVisible}
        currencies={supportedCurrencies}
        selectedCode={pendingSelection}
        onSelect={setPendingSelection}
        onConfirm={confirmPicker}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  rateWrap: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    gap: 4,
  },
  rateText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  subtleText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  errorText: {
    color: theme.colors.accent,
    fontSize: 12,
  },
  keypadWrap: {
    marginTop: theme.spacing.sm,
  },
});
