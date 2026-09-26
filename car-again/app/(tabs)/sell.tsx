import { View } from 'react-native';
import { useAppColors } from '@/constants/theme';

// This screen is never rendered directly.
// The Sell tab button in _layout.tsx navigates to /vehicle/create directly.
export default function SellScreen() {
  const C = useAppColors();
  return <View style={{ flex: 1, backgroundColor: C.bg }} />;
}
