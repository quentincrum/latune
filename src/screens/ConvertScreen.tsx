import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmountRow } from '../components/AmountRow';
import { Keypad } from '../components/Keypad';
import { convertWithPair, DEFAULT_RATE_DKK_TO_EUR, fetchLatestRate } from '../services/rates';
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

const CURRENCIES: Currency[] = [
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'Pound Sterling' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
];

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

export const ConvertScreen = () => {
  const [fromCurrency, setFromCurrency] = useState('DKK');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [activeCard, setActiveCard] = useState<ActiveCard>('from');
  const [fromExpression, setFromExpression] = useState('0');
  const [toExpression, setToExpression] = useState('0');
  const [fromValidValue, setFromValidValue] = useState(0);
  const [toValidValue, setToValidValue] = useState(0);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [rateDKKToEUR, setRateDKKToEUR] = useState(DEFAULT_RATE_DKK_TO_EUR);
  const [lastUpdated, setLastUpdated] = useState(nowTimestamp());
  const [rateError, setRateError] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pendingSelection, setPendingSelection] = useState('DKK');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let mounted = true;

    const loadRate = async () => {
      try {
        const result = await fetchLatestRate();
        if (!mounted) {
          return;
        }
        setRateDKKToEUR(result.rate);
        setLastUpdated(new Date(result.updatedAt).toLocaleString());
        setRateError(null);
      } catch {
        if (!mounted) {
          return;
        }
        setRateError('Offline: using last known rate');
      }
    };

    loadRate();

    return () => {
      mounted = false;
    };
  }, []);

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

    const converted = convertWithPair(toValidValue, toCurrency, fromCurrency, rateDKKToEUR);
    return formatAmount(converted);
  }, [activeCard, fromCurrency, fromValidValue, rateDKKToEUR, toCurrency, toValidValue]);

  const toAmount = useMemo(() => {
    if (activeCard === 'to') {
      return formatAmount(toValidValue);
    }

    const converted = convertWithPair(fromValidValue, fromCurrency, toCurrency, rateDKKToEUR);
    return formatAmount(converted);
  }, [activeCard, fromCurrency, fromValidValue, rateDKKToEUR, toCurrency, toValidValue]);

  const rateText = useMemo(() => {
    if (fromCurrency === toCurrency) {
      return `1 ${fromCurrency} = 1 ${toCurrency}`;
    }

    if (fromCurrency === 'DKK' && toCurrency === 'EUR') {
      return `1 DKK = ${rateDKKToEUR.toFixed(4)} EUR`;
    }

    if (fromCurrency === 'EUR' && toCurrency === 'DKK') {
      return `1 EUR = ${(1 / rateDKKToEUR).toFixed(4)} DKK`;
    }

    return `1 ${fromCurrency} = ${rateDKKToEUR.toFixed(4)} ${toCurrency}`;
  }, [fromCurrency, rateDKKToEUR, toCurrency]);

  const openPicker = (target: Exclude<PickerTarget, null>) => {
    setPickerTarget(target);
    setPendingSelection(target === 'from' ? fromCurrency : toCurrency);
    setPickerVisible(true);
  };

  const confirmPicker = () => {
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
        currencies={CURRENCIES}
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
