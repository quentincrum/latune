import { StyleSheet } from 'react-native';

export const theme = {
  colors: {
    background: '#0E0F12',
    surface: '#171A20',
    surfaceRaised: '#1D212A',
    textPrimary: '#F2F2F2',
    textSecondary: '#9FA5B4',
    accent: '#FF8A1F',
    shadowDark: 'rgba(0, 0, 0, 0.45)',
    shadowLight: 'rgba(255, 255, 255, 0.05)',
    border: '#2A2F3A',
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 28,
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 30,
    full: 999,
  },
  text: {
    small: 12,
    body: 16,
    title: 28,
    amount: 34,
  },
  shadows: StyleSheet.create({
    outer: {
      shadowColor: '#000',
      shadowOffset: { width: 8, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    innerHint: {
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.04)',
    },
  }),
};
