import { StyleSheet, Text, View } from 'react-native';
import { CurrencyPill } from './CurrencyPill';
import { NeumorphicCard } from './NeumorphicCard';
import { theme } from '../theme/theme';

type AmountRowProps = {
  label: 'From' | 'To';
  currencyCode: string;
  amount: string;
  active?: boolean;
  onCurrencyPress: () => void;
};

export const AmountRow = ({ label, currencyCode, amount, active, onCurrencyPress }: AmountRowProps) => {
  return (
    <NeumorphicCard active={active} style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <CurrencyPill
          code={currencyCode}
          onPress={onCurrencyPress}
          accessibilityLabel={`Select ${label.toLowerCase()} currency`}
        />
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.amount}>
          {amount}
        </Text>
      </View>
    </NeumorphicCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
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
  amount: {
    flex: 1,
    textAlign: 'right',
    color: theme.colors.textPrimary,
    fontSize: theme.text.amount,
    fontWeight: '700',
  },
});
