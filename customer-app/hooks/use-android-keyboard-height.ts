import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// Android (edgeToEdgeEnabled) pe keyboard khulne se window resize nahi hoti,
// is liye fields keyboard ke peeche chhup jati hain. Ye hook keyboard ki height deta hai
// (iOS pe hamesha 0 — wahan KeyboardAvoidingView 'padding' pehle se kaam karta hai).
export function useAndroidKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', e => setHeight(e.endCoordinates?.height ?? 0));
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return height;
}
