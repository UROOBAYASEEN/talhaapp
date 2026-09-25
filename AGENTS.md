# Autowizor Ecosystem — Project Rules

## Project Structure
- **Frontend:** `car-again/` — Expo 54, React Native 0.81.5, Expo Router v6
- **Backend:** `backend/` — Python FastAPI, MongoDB/Beanie, port 8000

---

## Frontend UI Rules

### Background Color
Every screen/page MUST have `backgroundColor: AppColors.bg` which is `#010A1F`.
No exceptions — all screens use this as the base background.

```tsx
import { AppColors } from '@/constants/theme';

// Every screen root view:
<View style={{ flex: 1, backgroundColor: AppColors.bg }}>
```

### Input Fields
All input fields across the app MUST follow this exact style (reference: `car-again/screenshot/image.png`):

```tsx
// Standard input field style
const inputStyle = {
  backgroundColor: AppColors.glassBg,        // rgba(3,12,40,0.6)
  borderWidth: 1,
  borderColor: AppColors.glassBorder,        // rgba(255,255,255,0.15)
  borderRadius: 30,                          // pill/heavily rounded
  paddingHorizontal: 20,
  paddingVertical: 14,
  color: AppColors.textPrimary,              // #f9fafc
  fontSize: 15,
};

// Placeholder color
placeholderTextColor={AppColors.textPlaceholder}  // #8f8f8f
```

Key input field traits (from screenshot):
- **Shape:** Pill-shaped, borderRadius: 30
- **Background:** Dark navy glass — `rgba(3,12,40,0.6)`
- **Border:** Light blue — `rgba(100,160,255,0.5)`
- **Text color:** `#f9fafc`
- **Placeholder:** `#8f8f8f`

Never use plain white, light, or square input fields on any screen.

### Input Field Inset Shadow
Every input field, button, and card MUST have these inset shadow gradients inside using `LinearGradient` from `expo-linear-gradient`. Add `overflow: 'hidden'` to the container:

```tsx
import { LinearGradient } from 'expo-linear-gradient';

// Inside the input/card View (before content):
<LinearGradient
  colors={['rgba(22,64,136,0.2)', 'transparent']}
  start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
  style={StyleSheet.absoluteFillObject} pointerEvents="none"
/>
<LinearGradient
  colors={['rgba(13,37,84,0.18)', 'transparent']}
  start={{ x: 0, y: 0.5 }} end={{ x: 0.45, y: 0.5 }}
  style={StyleSheet.absoluteFillObject} pointerEvents="none"
/>
<LinearGradient
  colors={['transparent', 'rgba(29,83,175,0.2)']}
  start={{ x: 0.5, y: 0.4 }} end={{ x: 0.5, y: 1 }}
  style={StyleSheet.absoluteFillObject} pointerEvents="none"
/>
```

These simulate CSS:
- `box-shadow: 0px -9px 30px 0px rgba(22,64,136,0.5) inset` — top
- `box-shadow: -11px 0px 16px 0px rgba(13,37,84,0.5) inset` — left
- `box-shadow: 0px 7px 14px 0px rgba(29,83,175,0.5) inset` — bottom

### Card 4-Side Border Shade Design
Cards (list items/policy cards/claim cards) ke liye 4 taraf se subtle inset shade lagao using 4 `LinearGradient` layers. `overflow: 'hidden'` zaroori hai container pe:

```tsx
// Top shade
<LinearGradient
  colors={['rgba(22,64,136,0.35)', 'transparent']}
  start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }}
  style={StyleSheet.absoluteFillObject} pointerEvents="none"
/>
// Bottom shade
<LinearGradient
  colors={['transparent', 'rgba(29,83,175,0.35)']}
  start={{ x: 0.5, y: 0.75 }} end={{ x: 0.5, y: 1 }}
  style={StyleSheet.absoluteFillObject} pointerEvents="none"
/>
// Left shade
<LinearGradient
  colors={['rgba(13,37,84,0.35)', 'transparent']}
  start={{ x: 0, y: 0.5 }} end={{ x: 0.25, y: 0.5 }}
  style={StyleSheet.absoluteFillObject} pointerEvents="none"
/>
// Right shade
<LinearGradient
  colors={['transparent', 'rgba(13,37,84,0.35)']}
  start={{ x: 0.75, y: 0.5 }} end={{ x: 1, y: 0.5 }}
  style={StyleSheet.absoluteFillObject} pointerEvents="none"
/>
```

Card base style:
```tsx
{
  borderRadius: 16,
  overflow: 'hidden',
  backgroundColor: 'rgba(1,6,20,1)',
  borderWidth: 1,
  borderColor: 'rgba(100,160,255,0.5)',
}
```

---

### Color Update Scope Rule
**CRITICAL:** Jab bhi koi color ya style update karne ka kaho — sirf usi specific file/page mein update karo jo mention ki gayi ho. Poori app ya baaki files mein color changes MAT karo jab tak explicitly na kaha jaye.

- Agar kaha jaye "is page ka button color change karo" → sirf usi file mein change karo
- Agar kaha jaye "sab jagah update karo" ya "globally change karo" → tab hi baaki files touch karo
- Default behavior: **scope = sirf mentioned file/component**

---

### Colors
Always import from `car-again/constants/theme.ts`:

```tsx
import { AppColors } from '@/constants/theme';
```

| Token | Value | Usage |
|---|---|---|
| `AppColors.bg` | `#010A1F` | All screen backgrounds |
| `AppColors.glassBg` | `rgba(3,12,40,0.6)` | Cards, inputs, modals |
| `AppColors.glassBorder` | `rgba(255,255,255,0.15)` | Borders on glass elements |
| `AppColors.textPrimary` | `#f9fafc` | Main text |
| `AppColors.textSecondary` | `#baacb6` | Secondary/subtitle text |
| `AppColors.textPlaceholder` | `#8f8f8f` | Input placeholders |
| `AppColors.gradientStart` | `#032a69` | Gradient buttons |
| `AppColors.gradientEnd` | `#e2671b` | Gradient buttons |

### Design Language
- **Theme:** Dark glassmorphism
- **Style:** All components use glass-like surfaces with dark navy backgrounds
- **No light mode UI** — always dark, always `#010A1F` base

---

## Backend Rules
- API base: `http://10.197.167.15:8000/api/v1`
- Auth tokens via `expo-secure-store` in `AuthContext`
- Roles: `customer`, `bank_representative`, `dealership_owner`, `individual_seller`, `insurance_provider`, `tracker_provider`
