import { StyleSheet, Text, View } from 'react-native';
import { CurrencyPill } from './CurrencyPill';
import { NeumorphicCard } from './NeumorphicCard';
import { theme } from '../theme/theme';

type AmountRowProps = {
  label: 'From' | 'To';
  currencyCode: string;
  amount: string;
  expression?: string;
  calcError?: string | null;
  expanded?: boolean;
  active?: boolean;
  onCurrencyPress: () => void;
};

export const AmountRow = ({
  label,
  currencyCode,
  amount,
  expression,
  calcError,
  expanded,
  active,
  onCurrencyPress,
}: AmountRowProps) => {
  const showCalculatorLayout = Boolean(expression);

  return (
    <NeumorphicCard active={active} style={[styles.card, expanded && styles.expandedCard]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, showCalculatorLayout && styles.rowTopAligned]}>
        <CurrencyPill
          code={currencyCode}
          onPress={onCurrencyPress}
          accessibilityLabel={`Select ${label.toLowerCase()} currency`}
        />
        <View style={styles.amountWrap}>
          {showCalculatorLayout ? (
            <View style={styles.calcLine}>
              <Text numberOfLines={1} style={[styles.expression, calcError ? styles.expressionError : null]}>
                {expression}
              </Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.amount}>
                {amount}
              </Text>
            </View>
          ) : (
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.amount}>
              {amount}
            </Text>
          )}
          {calcError ? (
            <Text numberOfLines={1} style={styles.inlineError}>
              {calcError}
            </Text>
          ) : null}
        </View>
      </View>
    </NeumorphicCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  expandedCard: {
    minHeight: 138,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.text.small,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  rowTopAligned: {
    alignItems: 'flex-start',
  },
  amountWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  calcLine: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  expression: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 15,
    textAlign: 'right',
    marginBottom: 6,
  },
  expressionError: {
    color: '#D88484',
  },
  amount: {
    flexShrink: 1,
    textAlign: 'right',
    color: theme.colors.textPrimary,
    fontSize: theme.text.amount,
    fontWeight: '700',
  },
  inlineError: {
    marginTop: 2,
    color: '#D88484',
    fontSize: 11,
  },
});
