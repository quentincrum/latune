import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CurrencyPill } from './CurrencyPill';
import { NeumorphicCard } from './NeumorphicCard';
import { theme } from '../theme/theme';

type AmountRowProps = {
  label: 'From' | 'To';
  currencyCode: string;
  amount: string;
  expression?: string;
  calcError?: string | null;
  active?: boolean;
  onCurrencyPress: () => void;
  onPress?: () => void;
};

export const AmountRow = ({
  label,
  currencyCode,
  amount,
  expression,
  calcError,
  active,
  onCurrencyPress,
  onPress,
}: AmountRowProps) => {
  const showCalculatorLayout = Boolean(expression);

  const content = (
    <NeumorphicCard active={active} style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
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

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Focus ${label.toLowerCase()} amount`}
      style={styles.pressable}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.text.small,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
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
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 2,
  },
  expressionError: {
    color: '#D88484',
  },
  amount: {
    flexShrink: 1,
    textAlign: 'right',
    color: theme.colors.textPrimary,
    fontSize: 30,
    fontWeight: '700',
  },
  inlineError: {
    marginTop: 1,
    color: '#D88484',
    fontSize: 10,
  },
});
