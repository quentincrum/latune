import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { NeumorphicButton } from './NeumorphicButton';
import { theme } from '../theme/theme';

type KeypadProps = {
  onInput: (key: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onEquals: () => void;
};

const ROWS = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['.', '0', '⌫', '+'],
] as const;

export const Keypad = ({ onInput, onClear, onBackspace, onEquals }: KeypadProps) => {
  const { height } = useWindowDimensions();
  const compact = height < 760;

  const buttonStyles = useMemo(
    () => [styles.key, compact ? styles.keyCompact : null],
    [compact],
  );

  return (
    <View style={styles.wrapper}>
      {ROWS.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((key) => {
            const isBackspace = key === '⌫';
            return (
              <NeumorphicButton
                key={key}
                label={key}
                onPress={() => (isBackspace ? onBackspace() : onInput(key))}
                accessibilityLabel={isBackspace ? 'Backspace' : `Input ${key}`}
                style={buttonStyles}
              />
            );
          })}
        </View>
      ))}

      <View style={styles.row}>
        <NeumorphicButton
          label="C"
          onPress={onClear}
          accessibilityLabel="Clear expression"
          style={[styles.wideKey, compact ? styles.keyCompact : null]}
        />
        <NeumorphicButton
          label="="
          onPress={onEquals}
          primary
          accessibilityLabel="Evaluate expression"
          style={[styles.wideKey, compact ? styles.keyCompact : null]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  key: {
    flex: 1,
    minHeight: 58,
  },
  keyCompact: {
    minHeight: 52,
  },
  wideKey: {
    flex: 1,
    minHeight: 58,
  },
});
