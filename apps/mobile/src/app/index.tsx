import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { actions, areas, categories, type Category } from '@/data/actions';

const renderedAt = Date.now();

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(value));
}

export default function HomeScreen() {
  const [area, setArea] = useState('熊本県全域');
  const [category, setCategory] = useState<Category>('すべて');
  const [largeText, setLargeText] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('relief-area'),
      AsyncStorage.getItem('relief-large-text'),
    ]).then(([savedArea, savedLargeText]) => {
      if (savedArea && areas.includes(savedArea)) setArea(savedArea);
      setLargeText(savedLargeText === 'true');
    });
  }, []);

  const visibleActions = useMemo(
    () =>
      actions.filter(
        (item) =>
          (category === 'すべて' || item.category === category) &&
          (area === '熊本県全域' || item.areas.includes('熊本県全域') || item.areas.includes(area)),
      ),
    [area, category],
  );

  async function selectArea(value: string) {
    setArea(value);
    await AsyncStorage.setItem('relief-area', value);
  }

  async function toggleLargeText() {
    const next = !largeText;
    setLargeText(next);
    await AsyncStorage.setItem('relief-large-text', String(next));
  }

  function openOfficial(url: string, name: string) {
    Alert.alert(
      '公式サイトを開きます',
      `${name}のサイトへ移動します。接続先で位置情報やCookieが利用される場合があります。`,
      [
        { text: 'やめる', style: 'cancel' },
        { text: '公式サイトを開く', onPress: () => Linking.openURL(url) },
      ],
    );
  }

  const scale = largeText ? 1.13 : 1;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.topSafe}>
        <View style={styles.emergencyBar}>
          <Text style={[styles.emergencyLabel, { fontSize: 12 * scale }]}>命の危険・火災・救急</Text>
          <View style={styles.emergencyLinks}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="救急と消防に119番で電話する"
              onPress={() => Linking.openURL('tel:119')}
              style={styles.emergencyButton}>
              <Text style={styles.emergencyButtonText}>119</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="警察に110番で電話する"
              onPress={() => Linking.openURL('tel:110')}
              style={styles.emergencyButton}>
              <Text style={styles.emergencyButtonText}>警察 110</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>火</Text></View>
            <View>
              <Text style={[styles.kicker, { fontSize: 10 * scale }]}>有志による公式情報への案内</Text>
              <Text style={[styles.brandTitle, { fontSize: 21 * scale }]}>くまもと いまどうするナビ</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: largeText }}
            onPress={toggleLargeText}
            style={styles.textButton}>
            <Text style={styles.textButtonText}>{largeText ? '標準' : '文字 大'}</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={[styles.heroKicker, { fontSize: 12 * scale }]}>令和8年熊本地震・生活支援</Text>
          <Text style={[styles.heroTitle, { fontSize: 40 * scale }]}>いま、一番{'\n'}困っていることは？</Text>
          <View style={styles.freshness}>
            <View style={styles.freshnessDot} />
            <View style={styles.freshnessText}>
              <Text style={[styles.freshnessTitle, { fontSize: 13 * scale }]}>公式サイトの接続を確認</Text>
              <Text style={[styles.freshnessTime, { fontSize: 12 * scale }]}>7月30日 09:35</Text>
            </View>
          </View>
          <Text style={[styles.heroNote, { fontSize: 12 * scale }]}>
            状況は変わる可能性があります。リンク先の発表時刻を確認してください。
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { fontSize: 12 * scale }]}>市町村</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {areas.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: area === item }}
              onPress={() => selectArea(item)}
              style={[styles.chip, area === item && styles.chipActive]}>
              <Text style={[styles.chipText, area === item && styles.chipTextActive, { fontSize: 13 * scale }]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.sectionLabel, { fontSize: 12 * scale }]}>困りごと</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: category === item }}
              onPress={() => setCategory(item)}
              style={[styles.chip, category === item && styles.chipActive]}>
              <Text style={[styles.chipText, category === item && styles.chipTextActive, { fontSize: 13 * scale }]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: 23 * scale }]}>{area}で確認</Text>
          <Text style={styles.resultCount}>{visibleActions.length}件</Text>
        </View>

        <View style={styles.cardList}>
          {visibleActions.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconCircle}><Text style={styles.iconText}>{item.icon}</Text></View>
                <View style={styles.tag}><Text style={styles.tagText}>{item.category}</Text></View>
                {item.offline && <View style={styles.tag}><Text style={styles.tagText}>端末に保存済み</Text></View>}
                <View style={styles.tag}><Text style={styles.tagText}>公式情報</Text></View>
                {renderedAt >= new Date(item.expiresAt).getTime() && (
                  <View style={styles.expiredTag}><Text style={styles.expiredTagText}>期限切れ</Text></View>
                )}
              </View>
              <Text style={[styles.cardTitle, { fontSize: 21 * scale }]}>{item.title}</Text>
              {renderedAt >= new Date(item.expiresAt).getTime() ? (
                <View style={styles.expiredBox}>
                  <Text style={[styles.expiredTitle, { fontSize: 14 * scale }]}>現在の状況は確認できません</Text>
                  <Text style={[styles.expiredText, { fontSize: 13 * scale }]}>
                    保存情報の有効期限を過ぎています。移動や申込みの前に公式サイトで確認してください。
                  </Text>
                </View>
              ) : (
                <Text style={[styles.cardBody, { fontSize: 15 * scale }]}>{item.summary}</Text>
              )}
              <View style={styles.caution}>
                <Text style={[styles.cautionTitle, { fontSize: 12 * scale }]}>注意</Text>
                <Text style={[styles.cautionText, { fontSize: 13 * scale }]}>{item.caution}</Text>
              </View>
              <Text style={[styles.source, { fontSize: 11 * scale }]}>
                出典：{item.sourceName}
                {'\n'}案内更新：{formatTimestamp(item.publishedAt)}
                {'\n'}取得：{formatTimestamp(item.fetchedAt)}
                {'\n'}接続確認：{formatTimestamp(item.checkedAt)}
                {'\n'}有効期限：{formatTimestamp(item.expiresAt)}
              </Text>
              <Pressable
                accessibilityRole="link"
                onPress={() => openOfficial(item.url, item.sourceName)}
                style={styles.primaryButton}>
                <Text style={[styles.primaryButtonText, { fontSize: 15 * scale }]}>公式サイトで確認</Text>
                <Text style={styles.primaryButtonArrow}>↗</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.localPanel}>
          <Text style={[styles.localTitle, { fontSize: 24 * scale }]}>通信が切れても、手順は残ります。</Text>
          <Text style={[styles.localBody, { fontSize: 14 * scale }]}>
            通信復旧、簡易トイレ、片付け前の写真などの行動カードはアプリ本体に保存されています。
          </Text>
          <Link href="/offline-guides" asChild>
            <Pressable accessibilityRole="link" style={styles.secondaryButton}>
              <Text style={[styles.secondaryButtonText, { fontSize: 15 * scale }]}>オフライン行動カードを見る</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.privacyPanel}>
          <Text style={[styles.privacyTitle, { fontSize: 25 * scale }]}>あなたの居場所を集めません。</Text>
          <Text style={[styles.privacyBody, { fontSize: 14 * scale }]}>
            ログイン、GPS、住所、氏名、被害写真、健康情報、利用者投稿、広告、アクセス解析は使いません。
          </Text>
          <Link href="/about" asChild>
            <Pressable accessibilityRole="link"><Text style={styles.aboutLink}>安全と出典について →</Text></Pressable>
          </Link>
        </View>

        <Text style={styles.footer}>
          熊本県・熊本市等の公式サービスではありません。自治体、消防、警察の指示を優先してください。
          {'\n'}{Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}版 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7f4' },
  topSafe: { backgroundColor: '#0b1e35' },
  emergencyBar: { minHeight: 52, paddingHorizontal: 18, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  emergencyLabel: { color: '#fff', fontWeight: '800' },
  emergencyLinks: { flexDirection: 'row', gap: 7 },
  emergencyButton: { minHeight: 36, justifyContent: 'center', borderWidth: 1, borderColor: '#718096', borderRadius: 20, paddingHorizontal: 12 },
  emergencyButtonText: { color: '#fff', fontWeight: '900' },
  content: { paddingBottom: 48 },
  header: { padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  brandMark: { width: 42, height: 50, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, backgroundColor: '#bd382c', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#fff', fontFamily: 'serif', fontSize: 22, fontWeight: '800' },
  kicker: { color: '#66727e', fontWeight: '700' },
  brandTitle: { color: '#132238', fontFamily: 'serif', fontWeight: '800' },
  textButton: { minWidth: 58, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cfd6dc' },
  textButtonText: { color: '#152d4a', fontWeight: '900' },
  hero: { marginHorizontal: 16, marginBottom: 26, padding: 26, backgroundColor: '#152d4a', borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 8, borderBottomRightRadius: 34 },
  heroKicker: { color: '#cdd8e2', fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontFamily: 'serif', fontWeight: '800', lineHeight: 48, marginTop: 9 },
  freshness: { marginTop: 26, padding: 14, borderRadius: 7, borderWidth: 1, borderColor: '#617389', backgroundColor: '#203b5c', flexDirection: 'row', alignItems: 'center', gap: 12 },
  freshnessDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#5ce2aa' },
  freshnessText: { flex: 1 },
  freshnessTitle: { color: '#fff', fontWeight: '800' },
  freshnessTime: { color: '#b8c8d7', fontFamily: 'monospace' },
  heroNote: { color: '#cdd8e2', marginTop: 12, lineHeight: 18 },
  sectionLabel: { color: '#5c6875', fontWeight: '900', marginHorizontal: 18, marginBottom: 7, letterSpacing: 1 },
  chips: { paddingHorizontal: 16, paddingBottom: 20, gap: 8 },
  chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: '#cfd6dc', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#152d4a', borderColor: '#152d4a' },
  chipText: { color: '#152d4a', fontWeight: '800' },
  chipTextActive: { color: '#fff' },
  sectionHeader: { marginHorizontal: 18, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#152d4a', flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { color: '#132238', fontFamily: 'serif', fontWeight: '800' },
  resultCount: { color: '#5c6875', fontFamily: 'monospace' },
  cardList: { padding: 16, gap: 14 },
  card: { padding: 22, borderRadius: 8, borderLeftWidth: 5, borderLeftColor: '#152d4a', backgroundColor: '#fff', shadowColor: '#132238', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e8ecef', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  iconText: { color: '#152d4a', fontFamily: 'serif', fontSize: 19, fontWeight: '900' },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3, backgroundColor: '#eef2f5' },
  tagText: { color: '#5c6875', fontSize: 10, fontWeight: '900' },
  expiredTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3, backgroundColor: '#fff0ed' },
  expiredTagText: { color: '#76251e', fontSize: 10, fontWeight: '900' },
  cardTitle: { color: '#132238', fontWeight: '900', lineHeight: 29, marginTop: 15 },
  cardBody: { color: '#3e4c5c', lineHeight: 23, marginTop: 7 },
  expiredBox: { marginTop: 12, padding: 13, borderWidth: 2, borderColor: '#d79f13', backgroundColor: '#fff7d8' },
  expiredTitle: { color: '#654b00', fontWeight: '900' },
  expiredText: { color: '#654b00', lineHeight: 20, marginTop: 4 },
  caution: { marginTop: 16, borderRadius: 5, padding: 13, backgroundColor: '#fff0ed' },
  cautionTitle: { color: '#8d2e25', fontWeight: '900' },
  cautionText: { color: '#76251e', lineHeight: 20, marginTop: 3 },
  source: { color: '#687582', fontFamily: 'monospace', lineHeight: 17, marginVertical: 14 },
  primaryButton: { minHeight: 52, paddingHorizontal: 16, borderRadius: 5, backgroundColor: '#152d4a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '900' },
  primaryButtonArrow: { color: '#fff', fontSize: 22 },
  localPanel: { margin: 16, padding: 25, borderRadius: 8, backgroundColor: '#152d4a' },
  localTitle: { color: '#fff', fontFamily: 'serif', fontWeight: '800', lineHeight: 32 },
  localBody: { color: '#d5e0e9', lineHeight: 22, marginTop: 9 },
  secondaryButton: { minHeight: 52, borderRadius: 5, borderWidth: 1, borderColor: '#b8c8d7', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  secondaryButtonText: { color: '#fff', fontWeight: '900' },
  privacyPanel: { marginHorizontal: 16, marginBottom: 24, padding: 25, backgroundColor: '#e8efe9', borderTopRightRadius: 34, borderRadius: 8 },
  privacyTitle: { color: '#17483c', fontFamily: 'serif', fontWeight: '800', lineHeight: 33 },
  privacyBody: { color: '#2e5c51', lineHeight: 22, marginTop: 10 },
  aboutLink: { color: '#17483c', fontWeight: '900', marginTop: 18, textDecorationLine: 'underline' },
  footer: { color: '#687582', fontSize: 11, lineHeight: 18, marginHorizontal: 20, paddingTop: 22, borderTopWidth: 1, borderTopColor: '#cfd6dc' },
});
