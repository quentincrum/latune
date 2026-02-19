import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmountRow } from '../components/AmountRow';
import { Keypad } from '../components/Keypad';
import { NeumorphicButton } from '../components/NeumorphicButton';
import { convertWithPair, DEFAULT_RATE_DKK_TO_EUR, fetchLatestRate } from '../services/rates';
import { theme } from '../theme/theme';
import { Currency } from '../types/currency';
import { formatAmount, nowTimestamp } from '../utils/format';
import {
  evaluateExpression,
  formatExpressionValue,
  getLastNumberSegment,
  isCalculatorOperator,
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

const MINUS = '−';

const formatForDisplay = (value: number) => formatExpressionValue(value).replace('-', MINUS);

const endsWithOperator = (value: string) => {
  if (!value) {
    return false;
  }

  const last = value[value.length - 1];
  return isCalculatorOperator(last);
};

export const ConvertScreen = () => {
  const [fromCurrency, setFromCurrency] = useState('DKK');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [expression, setExpression] = useState('0');
  const [lastValidValue, setLastValidValue] = useState(0);
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

  useEffect(() => {
    const evaluated = evaluateExpression(expression);
    if (evaluated === null) {
      setCalcError('Invalid expression');
      return;
    }

    setLastValidValue(evaluated);
    setCalcError(null);
  }, [expression]);

  const appendToken = (token: string) => {
    setExpression((current) => {
      let next = current;

      if (/^\d$/.test(token)) {
        if (current === '0') {
          next = token;
        } else if (current === `${MINUS}0` && token !== '0') {
          next = `${MINUS}${token}`;
        } else {
          next = `${current}${token}`;
        }

        return next;
      }

      if (token === '.') {
        if (current === '0') {
          next = '0.';
          return next;
        }

        if (current === MINUS) {
          next = `${MINUS}0.`;
          return next;
        }

        if (endsWithOperator(current)) {
          next = `${current}0.`;
          return next;
        }

        const lastSegment = getLastNumberSegment(current);
        if (lastSegment.includes('.')) {
          return current;
        }

        next = `${current}.`;
        return next;
      }

      if (isCalculatorOperator(token)) {
        if (current === '0' && token === MINUS) {
          next = MINUS;
          return next;
        }

        if (current === MINUS) {
          return current;
        }

        if (endsWithOperator(current)) {
          const lastChar = current[current.length - 1];
          if (token === MINUS && lastChar !== MINUS) {
            next = `${current}${token}`;
            return next;
          }

          next = `${current.slice(0, -1)}${token}`;
          return next;
        }

        next = `${current}${token}`;
      }

      return next;
    });
  };

  const handleBackspace = () => {
    setExpression((current) => {
      const next = current.length <= 1 ? '0' : current.slice(0, -1);
      return next === MINUS || next === '' ? '0' : next;
    });
  };

  const handleClear = () => {
    setExpression('0');
    setLastValidValue(0);
    setCalcError(null);
  };

  const handleEquals = () => {
    const evaluated = evaluateExpression(expression);
    if (evaluated === null) {
      setCalcError('Invalid expression');
      return;
    }

    const displayValue = formatForDisplay(evaluated);
    setExpression(displayValue);
    setLastValidValue(evaluated);
    setCalcError(null);
  };

  const convertedAmount = useMemo(() => {
    const value = convertWithPair(lastValidValue, fromCurrency, toCurrency, rateDKKToEUR);
    return formatAmount(value);
  }, [fromCurrency, lastValidValue, rateDKKToEUR, toCurrency]);

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

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: theme.spacing.md + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" style={styles.circleBtn}>
            <Text style={styles.circleText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Convert</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="More options" style={styles.circleBtn}>
            <Text style={styles.circleText}>⋯</Text>
          </Pressable>
        </View>

        <AmountRow
          label="From"
          currencyCode={fromCurrency}
          amount={formatAmount(lastValidValue)}
          expression={expression}
          calcError={calcError}
          expanded
          onCurrencyPress={() => openPicker('from')}
          active
        />

        <View style={styles.swapWrap}>
          <NeumorphicButton
            primary
            onPress={swapCurrencies}
            accessibilityLabel="Swap currencies"
            style={styles.swapBtn}
          >
            <Text style={styles.swapIcon}>⇅</Text>
          </NeumorphicButton>
        </View>

        <AmountRow
          label="To"
          currencyCode={toCurrency}
          amount={convertedAmount}
          onCurrencyPress={() => openPicker('to')}
        />

        <View style={styles.rateWrap}>
          <Text style={styles.rateText}>{rateText}</Text>
          <Text style={styles.subtleText}>Updated: {lastUpdated}</Text>
          {rateError ? <Text style={styles.errorText}>{rateError}</Text> : null}
        </View>

        <View style={styles.keypadWrap}>
          <Keypad
            onInput={appendToken}
            onBackspace={handleBackspace}
            onClear={handleClear}
            onEquals={handleEquals}
          />
        </View>
      </ScrollView>

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
    flexGrow: 1,
  },
  topBar: {
    marginTop: 0,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: {
    color: theme.colors.textSecondary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  swapWrap: {
    alignItems: 'center',
    marginTop: -theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    zIndex: 2,
  },
  swapBtn: {
    width: 64,
    minHeight: 64,
    borderRadius: theme.radius.full,
  },
  swapIcon: {
    color: '#1A1A1A',
    fontSize: 26,
    fontWeight: '800',
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
