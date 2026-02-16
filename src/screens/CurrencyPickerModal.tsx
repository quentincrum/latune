import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Currency } from '../types/currency';
import { NeumorphicButton } from '../components/NeumorphicButton';
import { theme } from '../theme/theme';

type CurrencyPickerModalProps = {
  visible: boolean;
  currencies: Currency[];
  selectedCode: string;
  onSelect: (currencyCode: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export const CurrencyPickerModal = ({
  visible,
  currencies,
  selectedCode,
  onSelect,
  onConfirm,
  onClose,
}: CurrencyPickerModalProps) => {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Select Currency</Text>
          <ScrollView contentContainerStyle={styles.grid}>
            {currencies.map((currency) => {
              const selected = currency.code === selectedCode;
              return (
                <Pressable
                  key={currency.code}
                  accessibilityRole="button"
                  accessibilityLabel={`Pick ${currency.code}`}
                  onPress={() => onSelect(currency.code)}
                  style={[styles.tile, selected && styles.tileSelected]}
                >
                  <Text style={styles.symbol}>{currency.symbol}</Text>
                  <Text style={styles.code}>{currency.code}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <NeumorphicButton
            primary
            onPress={onConfirm}
            accessibilityLabel="Confirm currency selection"
            style={styles.confirmButton}
          >
            <Text style={styles.check}>✓</Text>
          </NeumorphicButton>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    maxHeight: '82%',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  tile: {
    width: '31%',
    minHeight: 92,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileSelected: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
  },
  symbol: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  code: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmButton: {
    marginTop: theme.spacing.sm,
  },
  check: {
    color: '#1A1A1A',
    fontSize: 32,
    fontWeight: '700',
  },
});
