import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './src/theme/theme';
import { ConvertScreen } from './src/screens/ConvertScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar
        style="light"
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      <ConvertScreen />
    </SafeAreaProvider>
  );
}