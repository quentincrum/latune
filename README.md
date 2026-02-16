# Currency Converter (Expo + React Native + TypeScript)

A dark, soft-neumorphic mobile currency converter app with:
- DKK to EUR conversion and swap direction
- Numeric keypad input
- Currency picker modal
- Exchange rate + last updated timestamp
- Offline-friendly fallback to last known rate

## Run

```bash
npm install
npx expo start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- or scan the QR code with Expo Go

## Project Structure

- `App.tsx`: app entry
- `src/theme/theme.ts`: colors, spacing, radius, shadows
- `src/components/`: reusable UI components
- `src/screens/ConvertScreen.tsx`: main converter screen
- `src/screens/CurrencyPickerModal.tsx`: currency picker modal
- `src/services/rates.ts`: placeholder rate service and conversion helpers
- `src/utils/format.ts`: amount/date formatting utilities

## Notes

- Current rate service uses a static placeholder (`DKK -> EUR`) and is structured for easy replacement with a real API call later.
- If fetching a new rate fails, the app keeps the last known rate in state.
