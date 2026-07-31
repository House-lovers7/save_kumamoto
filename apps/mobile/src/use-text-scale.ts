import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  LEGACY_LARGE_TEXT_KEY,
  TEXT_SCALE_KEY,
  textScaleFactors,
  textScales,
  type TextScale,
} from '@/theme';

/**
 * 文字サイズは画面をまたいで同じでなければならない。
 * ホームで「特大」にした人が、オフライン行動カードや出典の説明で標準へ戻ると、
 * 通信が切れたときに一番読む必要のある手順が読めなくなる。
 */
export function useTextScale() {
  const [textScale, setTextScale] = useState<TextScale>('standard');

  useEffect(() => {
    let active = true;
    Promise.all([
      AsyncStorage.getItem(TEXT_SCALE_KEY),
      AsyncStorage.getItem(LEGACY_LARGE_TEXT_KEY),
    ]).then(([saved, legacyLarge]) => {
      if (!active) return;
      if (saved && textScales.includes(saved as TextScale)) {
        setTextScale(saved as TextScale);
      } else if (legacyLarge === 'true') {
        // 2段階時代の「文字 大」設定を引き継ぐ。
        setTextScale('large');
        AsyncStorage.setItem(TEXT_SCALE_KEY, 'large');
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const changeTextScale = useCallback(async (value: TextScale) => {
    setTextScale(value);
    await AsyncStorage.setItem(TEXT_SCALE_KEY, value);
  }, []);

  return { textScale, changeTextScale, scale: textScaleFactors[textScale] };
}
