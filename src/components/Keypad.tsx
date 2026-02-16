import { StyleSheet, Text, View } from 'react-native';
import { NeumorphicButton } from './NeumorphicButton';
import { theme } from '../theme/theme';

type KeypadProps = {
  onInput: (key: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onConfirm: () => void;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

export const Keypad = ({ onInput, onClear, onBackspace, onConfirm }: KeypadProps) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.grid}>
        {KEYS.map((key) => (
          <NeumorphicButton
            key={key}
            label={key}
            onPress={() => onInput(key)}
            accessibilityLabel={`Input ${key}`}
            style={styles.key}
          />
        ))}
        <NeumorphicButton
          label="⌫"
          onPress={onBackspace}
          accessibilityLabel="Backspace"
          style={styles.key}
        />
        <NeumorphicButton label="C" onPress={onClear} accessibilityLabel="Clear amount" style={styles.key} />
        <NeumorphicButton onPress={onConfirm} primary accessibilityLabel="Confirm amount" style={styles.key}>
          <Text style={styles.confirmIcon}>➜</Text>
        </NeumorphicButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: theme.spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  key: {
    width: '31%',
  },
  confirmIcon: {
    color: '#1A1A1A',
    fontSize: 30,
    fontWeight: '700',
  },
});
