import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme } from '../theme/theme';

type NeumorphicButtonProps = {
  label?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  primary?: boolean;
  accessibilityLabel: string;
  children?: ReactNode;
};

export const NeumorphicButton = ({
  label,
  onPress,
  style,
  primary,
  accessibilityLabel,
  children,
}: NeumorphicButtonProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.button, primary && styles.primary, pressed && styles.pressed, style]}
    >
      {children}
      {label ? <Text style={[styles.label, primary && styles.labelPrimary]}>{label}</Text> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 68,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.outer,
  },
  primary: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '600',
  },
  labelPrimary: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
});
