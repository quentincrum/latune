import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../theme/theme';

type CurrencyPillProps = {
  code: string;
  onPress: () => void;
  accessibilityLabel: string;
};

export const CurrencyPill = ({ code, onPress, accessibilityLabel }: CurrencyPillProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <Text style={styles.code}>{code}</Text>
      <Text style={styles.chevron}>⌄</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  code: {
    color: theme.colors.textPrimary,
    fontSize: theme.text.body,
    fontWeight: '700',
  },
  chevron: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: -2,
  },
  pressed: {
    opacity: 0.8,
  },
});
