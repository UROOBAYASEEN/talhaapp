import { Platform, useColorScheme } from 'react-native';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0A0B14',
    tint: '#FFFFFF',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FFFFFF',
  },
};

// Dark mode — Figma "Autowizor Ecosystem Design" Dark Mode App Design
export const AppColors = {
  bg: '#010a1f',
  glassBg: 'rgba(3,12,40,0.6)',
  glassBorder: 'rgba(255,255,255,0.15)',
  roleIconBg: '#082052',
  textPrimary: '#f9fafc',
  textSecondary: '#baacb6',
  textPlaceholder: '#8f8f8f',
  textHint: '#ff6b6d',
  textRole: '#d2d2d2',
  gradientStart: '#032a69',
  gradientEnd: '#e2671b',
  selectedIndicator: '#dd651c',
  selectedIndicatorBorder: '#136ab1',
  unselectedIndicatorBorder: '#baacb6',
  homeIndicator: '#0d0d0d',
  divider: 'rgba(255,255,255,0.15)',
  success: '#4CAF50',
  isDark: true,
};

// Light mode — main bg pure white (user: main color bg white rakhu)
export const AppColorsLight = {
  bg: '#ffffff',
  glassBg: 'rgba(255,255,255,0.96)',
  glassBorder: 'rgba(3,12,40,0.12)',
  roleIconBg: '#eef2ff',
  textPrimary: '#000000',
  textSecondary: '#1a1a2e',
  textPlaceholder: '#555566',
  textHint: '#e05257',
  textRole: '#0a0a14',
  gradientStart: '#032a69',
  gradientEnd: '#e2671b',
  selectedIndicator: '#dd651c',
  selectedIndicatorBorder: '#136ab1',
  unselectedIndicatorBorder: '#9ba4b5',
  homeIndicator: '#ffffff',
  divider: 'rgba(3,12,40,0.12)',
  success: '#4CAF50',
  isDark: false,
};

export function useAppColors() {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? AppColors : AppColorsLight;
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
