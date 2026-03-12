import { Platform, StyleSheet } from 'react-native';

export const theme = {
  colors: {
    background: '#0E0F12',
    surface: '#171A20',
    surfaceRaised: '#1D212A',
    textPrimary: '#F2F2F2',
    textSecondary: '#9FA5B4',
    accent: '#FF8A1F',
    border: '#2A2F3A',
    shadowDark: 'rgba(0, 0, 0, 0.55)',
    shadowLight: 'rgba(255, 255, 255, 0.06)',
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 36,
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 30,
    full: 999,
  },
  typography: {
    title: { fontSize: 22, fontWeight: '700' as const },
    label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.2 },
    body: { fontSize: 14, fontWeight: '600' as const },
    caption: { fontSize: 12, fontWeight: '500' as const },
  },
  shadows: StyleSheet.create({
    softOuter: {
      shadowColor: '#000',
      shadowOffset: { width: 10, height: 10 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: Platform.select({ android: 10, ios: 0 }),
    },
    softOuterReverse: {
      shadowColor: '#000',
      shadowOffset: { width: -8, height: -8 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
      elevation: Platform.select({ android: 6, ios: 0 }),
    },
    highlightEdge: {
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
    },
  }),
};