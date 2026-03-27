import { useRef } from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme } from '../theme/theme';

type NeumorphicButtonProps = {
  label?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  primary?: boolean;
  accessibilityLabel: string;
  children?: React.ReactNode;
};

export const NeumorphicButton = ({
  label,
  onPress,
  style,
  primary,
  accessibilityLabel,
  children,
}: NeumorphicButtonProps) => {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      speed: 50,
      bounciness: 2,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      speed: 30,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const scale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.97],
  });

  const overlayOpacity = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View style={[styles.button, primary && styles.primary, style, { transform: [{ scale }] }]}>
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.pressOverlay, { opacity: overlayOpacity }]} />
        {children}
        {label ? <Text style={[styles.label, primary && styles.labelPrimary]}>{label}</Text> : null}
      </Animated.View>
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
    ...theme.shadows.softOuter,
  },
  primary: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  pressOverlay: {
    borderRadius: theme.radius.md,
    backgroundColor: '#FFFFFF',
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
