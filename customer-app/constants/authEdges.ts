import { Platform } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

// Android: root layout (app/_layout.tsx) already pads the bottom inset for auth screens,
// so SafeAreaView must not add it again (warna neeche khali blue patti aati hai).
// iOS: root pads nothing, so the bottom edge stays.
export const AUTH_EDGES: Edge[] = Platform.OS === 'android'
  ? ['top', 'left', 'right']
  : ['top', 'left', 'right', 'bottom'];
