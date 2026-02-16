import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmountRow } from '../components/AmountRow';
import { Keypad } from '../components/Keypad';
import { NeumorphicButton } from '../components/NeumorphicButton';
import { convertWithPair, DEFAULT_RATE_DKK_TO_EUR, fetchLatestRate } from '../services/rates';
import { theme } from '../theme/theme';
import { Currency } from '../types/currency';
import { formatAmount, nowTimestamp } from '../utils/format';
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

export const ConvertScreen = () => {
  const [fromCurrency, setFromCurrency] = useState('DKK');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [rawInput, setRawInput] = useState('0');
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

  const inputAmount = useMemo(() => {
    const parsed = Number(rawInput);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [rawInput]);

  const convertedAmount = useMemo(() => {
    const value = convertWithPair(inputAmount, fromCurrency, toCurrency, rateDKKToEUR);
    return formatAmount(value);
  }, [fromCurrency, inputAmount, rateDKKToEUR, toCurrency]);

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

  const appendKey = (key: string) => {
    setRawInput((current) => {
      if (key === '.') {
        if (current.includes('.')) {
          return current;
        }
        return `${current}.`;
      }

      if (current === '0') {
        return key;
      }

      return `${current}${key}`;
    });
  };

  const handleBackspace = () => {
    setRawInput((current) => {
      if (current.length <= 1) {
        return '0';
      }
      return current.slice(0, -1);
    });
  };

  const handleClear = () => {
    setRawInput('0');
  };

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

  const confirmInput = () => {
    setRawInput((current) => {
      const numericValue = Number(current);
      if (!Number.isFinite(numericValue)) {
        return '0';
      }
      return String(numericValue);
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
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
        amount={formatAmount(inputAmount)}
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

      <Keypad onInput={appendKey} onBackspace={handleBackspace} onClear={handleClear} onConfirm={confirmInput} />

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
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    marginTop: 0,
    marginBottom: theme.spacing.xl,
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
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
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
});
