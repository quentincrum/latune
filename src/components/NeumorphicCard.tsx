import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../theme/theme';

type NeumorphicCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  active?: boolean;
};

export const NeumorphicCard = ({ children, style, active }: NeumorphicCardProps) => {
  return (
    <View style={[styles.card, active && styles.active, style]}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.softOuter,
  },
  inner: {
    flex: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  active: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
});
