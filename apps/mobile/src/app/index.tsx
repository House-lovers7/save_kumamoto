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
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  actionCards,
  categoryLabels,
  formatRelativeTime,
  formatTimestamp,
  isExpired,
  municipalities,
  siteCheckedAt,
  type ActionCategory,
  type ActionCard,
} from '@/data/actions';
import {
  AREA_KEY,
  freshnessColors,
  LEGACY_LARGE_TEXT_KEY,
  paletteFor,
  TEXT_SCALE_KEY,
  textScaleFactors,
  textScaleLabels,
  textScales,
  type Palette,
  type TextScale,
} from '@/theme';

type Municipality = (typeof municipalities)[number];

const categories = Object.keys(categoryLabels) as ActionCategory[];
const needCategories = categories.filter(
  (item): item is Exclude<ActionCategory, 'all'> => item !== 'all',
);

const categoryIcons: Record<Exclude<ActionCategory, 'all'>, string> = {
  emergency: '報',
  water: '水',
  essentials: '食',
  shelter: '避',
  medical: '薬',
  communication: '電',
  transport: '道',
  recovery: '片',
};

export default function HomeScreen() {
  const scheme = useColorScheme();
  const palette = paletteFor(scheme);
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [area, setArea] = useState<Municipality>('熊本県全域');
  const [category, setCategory] = useState<ActionCategory>('all');
  const [query, setQuery] = useState('');
  const [textScale, setTextScale] = useState<TextScale>('standard');
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  // 保存情報の期限切れは時間で変わる。起動時刻で固定せず、開いたままでも切り替わるようにする。
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(AREA_KEY),
      AsyncStorage.getItem(TEXT_SCALE_KEY),
      AsyncStorage.getItem(LEGACY_LARGE_TEXT_KEY),
    ]).then(([savedArea, savedScale, legacyLarge]) => {
      if (savedArea && municipalities.includes(savedArea as Municipality)) {
        setArea(savedArea as Municipality);
      }
      if (savedScale && textScales.includes(savedScale as TextScale)) {
        setTextScale(savedScale as TextScale);
      } else if (legacyLarge === 'true') {
        // 2段階時代の「文字 大」設定を引き継ぐ。
        setTextScale('large');
        AsyncStorage.setItem(TEXT_SCALE_KEY, 'large');
      }
    });
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matched = actionCards.filter((card) => {
      const matchesCategory = category === 'all' || card.category === category;
      const matchesArea =
        area === '熊本県全域' || card.areas.includes('熊本県全域') || card.areas.includes(area);
      const matchesQuery = !normalized || haystack(card).includes(normalized);
      return matchesCategory && matchesArea && matchesQuery;
    });
    if (!normalized) return matched;
    // 検索時は、その困りごと自体を扱うカードを先に出す。
    // 「薬」で高齢者向けカードが先に出たり、「ペット」が本文の「ペットボトル」に
    // 反応して給水カードが避難所より上に来たりするのを防ぐ。
    const rank = (card: ActionCard) => {
      if (card.title.toLowerCase().includes(normalized)) return 0;
      if (card.keywords.some((word) => word.toLowerCase().includes(normalized))) return 1;
      return 2;
    };
    return matched
      .map((card, index) => ({ card, index }))
      .sort((a, b) => rank(a.card) - rank(b.card) || a.index - b.index)
      .map((entry) => entry.card);
  }, [area, category, query]);

  const countsByCategory = useMemo(() => {
    const counts = new Map<ActionCategory, number>();
    for (const card of actionCards) {
      const matchesArea =
        area === '熊本県全域' || card.areas.includes('熊本県全域') || card.areas.includes(area);
      if (!matchesArea) continue;
      counts.set(card.category, (counts.get(card.category) ?? 0) + 1);
    }
    return counts;
  }, [area]);

  // 保存情報が古くなったら見た目も変える。全部期限切れなのに緑の信号を出さない。
  const freshness = useMemo(() => {
    const expired = actionCards.filter((card) => isExpired(card, now)).length;
    if (expired === 0) {
      return {
        tone: 'fresh' as const,
        headline: '公式サイトの接続を確認',
        note: '状況は変わる可能性があります。リンク先の発表時刻を確認してください。',
      };
    }
    if (expired === actionCards.length) {
      return {
        tone: 'stale' as const,
        headline: '保存した情報の期限が切れています',
        note: '下の手順は使えますが、場所・時間などの最新の状況は必ず公式サイトで確認してください。',
      };
    }
    return {
      tone: 'mixed' as const,
      headline: `一部の情報が期限切れです（${expired}／${actionCards.length}件）`,
      note: '期限切れの案内は「期限切れ」と表示しています。最新の状況は公式サイトで確認してください。',
    };
  }, [now]);

  async function selectArea(value: Municipality) {
    setArea(value);
    await AsyncStorage.setItem(AREA_KEY, value);
  }

  async function changeTextScale(value: TextScale) {
    setTextScale(value);
    await AsyncStorage.setItem(TEXT_SCALE_KEY, value);
  }

  function resetFilters() {
    setCategory('all');
    setQuery('');
  }

  function toggleSource(id: string) {
    setExpandedSources((current) => ({ ...current, [id]: !current[id] }));
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

  const scale = textScaleFactors[textScale];

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
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>火</Text>
            </View>
            <View style={styles.brandText}>
              <Text style={[styles.kicker, { fontSize: 10 * scale }]}>有志による公式情報への案内</Text>
              <Text style={[styles.brandTitle, { fontSize: 21 * scale }]}>くまもと いまどうするナビ</Text>
            </View>
          </View>
        </View>

        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="文字の大きさ"
          style={styles.textScaleRow}>
          <Text style={[styles.textScaleLabel, { fontSize: 12 * scale }]}>文字</Text>
          {textScales.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ selected: textScale === item }}
              accessibilityLabel={`文字の大きさ ${textScaleLabels[item]}`}
              onPress={() => changeTextScale(item)}
              style={[styles.textScaleButton, textScale === item && styles.textScaleButtonActive]}>
              <Text
                style={[
                  styles.textScaleButtonText,
                  textScale === item && styles.textScaleButtonTextActive,
                  { fontSize: 14 * scale },
                ]}>
                {textScaleLabels[item]}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.hero}>
          <Text style={[styles.heroKicker, { fontSize: 12 * scale }]}>令和8年熊本地震・生活支援</Text>
          <Text style={[styles.heroTitle, { fontSize: 34 * scale, lineHeight: 44 * scale }]}>
            いま、一番{'\n'}困っていることは？
          </Text>
          <View
            accessibilityRole="summary"
            style={[styles.freshness, freshness.tone === 'stale' && styles.freshnessStale]}>
            <View style={styles.freshnessHead}>
              <View
                style={[styles.freshnessDot, { backgroundColor: freshnessColors[freshness.tone] }]}
              />
              <View style={styles.freshnessText}>
                <Text style={[styles.freshnessTitle, { fontSize: 13 * scale }]}>
                  {freshness.headline}
                </Text>
                <Text style={[styles.freshnessTime, { fontSize: 12 * scale }]}>
                  接続確認 {formatRelativeTime(siteCheckedAt, now)}（{formatTimestamp(siteCheckedAt)}）
                </Text>
              </View>
            </View>
            <Text style={[styles.heroNote, { fontSize: 12 * scale }]}>{freshness.note}</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { fontSize: 12 * scale }]}>困りごとから選ぶ</Text>
        <View style={styles.needGrid}>
          {needCategories.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: category === item }}
              accessibilityLabel={`${categoryLabels[item]} ${countsByCategory.get(item) ?? 0}件`}
              onPress={() => setCategory(item)}
              style={[styles.needCell, category === item && styles.needCellActive]}>
              <Text style={styles.needIcon}>{categoryIcons[item]}</Text>
              <Text
                style={[
                  styles.needLabel,
                  category === item && styles.needLabelActive,
                  { fontSize: 14 * scale },
                ]}>
                {categoryLabels[item]}
              </Text>
              <Text
                style={[
                  styles.needCount,
                  category === item && styles.needCountActive,
                  { fontSize: 11 * scale },
                ]}>
                {countsByCategory.get(item) ?? 0}件
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { fontSize: 12 * scale }]}>市町村</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {municipalities.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: area === item }}
              onPress={() => selectArea(item)}
              style={[styles.chip, area === item && styles.chipActive]}>
              <Text
                style={[
                  styles.chipText,
                  area === item && styles.chipTextActive,
                  { fontSize: 13 * scale },
                ]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.sectionLabel, { fontSize: 12 * scale }]}>キーワード</Text>
        <View style={styles.searchWrap}>
          <TextInput
            accessibilityLabel="困りごとのキーワードで探す"
            value={query}
            onChangeText={setQuery}
            placeholder="水、薬、片付け…"
            placeholderTextColor={palette.muted}
            clearButtonMode="while-editing"
            returnKeyType="search"
            style={[styles.searchInput, { fontSize: 16 * scale }]}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: 23 * scale }]}>{area}で確認</Text>
          <Text style={styles.resultCount}>{filtered.length}件</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {categories.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: category === item }}
              onPress={() => setCategory(item)}
              style={[styles.chip, category === item && styles.chipActive]}>
              <Text
                style={[
                  styles.chipText,
                  category === item && styles.chipTextActive,
                  { fontSize: 13 * scale },
                ]}>
                {categoryLabels[item]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {filtered.length > 0 ? (
          <View style={styles.cardList}>
            {filtered.map((item) => {
              const expired = isExpired(item, now);
              const sourceOpen = expandedSources[item.id] === true;
              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.iconCircle}>
                      <Text style={styles.iconText}>{item.icon}</Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{categoryLabels[item.category]}</Text>
                    </View>
                    {item.offline && (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>端末に保存済み</Text>
                      </View>
                    )}
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>公式情報</Text>
                    </View>
                    {expired && (
                      <View style={styles.expiredTag}>
                        <Text style={styles.expiredTagText}>期限切れ</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.cardTitle, { fontSize: 21 * scale }]}>{item.title}</Text>

                  {expired ? (
                    <View style={styles.expiredBox}>
                      <Text style={[styles.expiredTitle, { fontSize: 14 * scale }]}>
                        現在の状況は確認できません
                      </Text>
                      <Text style={[styles.expiredText, { fontSize: 13 * scale }]}>
                        保存情報の有効期限（{formatTimestamp(item.expiresAt)}
                        ）を過ぎています。下の基本手順は使えますが、場所・時間などの最新状況は必ず公式サイトで確認してください。
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.cardBody, { fontSize: 15 * scale }]}>{item.summary}</Text>
                  )}

                  {/* 期限切れでも消さない。時刻に依存しない手順は、通信がなくても使える。 */}
                  <View style={styles.steps}>
                    <Text style={[styles.stepsTitle, { fontSize: 12 * scale }]}>まずやること</Text>
                    {item.steps.map((step, index) => (
                      <View key={step} style={styles.step}>
                        <Text style={styles.stepNumber}>{index + 1}</Text>
                        <Text style={[styles.stepText, { fontSize: 14 * scale }]}>{step}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.caution}>
                    <Text style={[styles.cautionTitle, { fontSize: 12 * scale }]}>注意</Text>
                    <Text style={[styles.cautionText, { fontSize: 13 * scale }]}>{item.caution}</Text>
                  </View>

                  <View style={styles.sourceSummary}>
                    <Text
                      style={[
                        styles.sourceSummaryText,
                        expired && styles.sourceSummaryExpired,
                        { fontSize: 12 * scale },
                      ]}>
                      {expired
                        ? `有効期限切れ（${formatTimestamp(item.expiresAt)}）`
                        : `有効期限 ${formatTimestamp(item.expiresAt)}まで`}
                    </Text>
                    <Text style={[styles.sourceSummaryText, { fontSize: 12 * scale }]}>
                      接続確認 {formatRelativeTime(item.checkedAt, now)}
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: sourceOpen }}
                    accessibilityLabel={`${item.title}の出典と時刻の詳細`}
                    onPress={() => toggleSource(item.id)}
                    style={styles.sourceToggle}>
                    <Text style={[styles.sourceToggleText, { fontSize: 13 * scale }]}>
                      出典と時刻の詳細 {sourceOpen ? '▲' : '▼'}
                    </Text>
                  </Pressable>
                  {sourceOpen && (
                    <Text style={[styles.source, { fontSize: 11 * scale }]}>
                      出典：{item.sourceName}
                      {'\n'}案内更新：{formatTimestamp(item.publishedAt)}
                      {'\n'}取得：{formatTimestamp(item.fetchedAt)}
                      {'\n'}接続確認：{formatTimestamp(item.checkedAt)}
                      {'\n'}有効期限：{formatTimestamp(item.expiresAt)}
                    </Text>
                  )}

                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`${item.action}（外部の公式サイト）`}
                    onPress={() => openOfficial(item.sourceUrl, item.sourceName)}
                    style={styles.primaryButton}>
                    <Text style={[styles.primaryButtonText, { fontSize: 15 * scale }]}>
                      {item.action}
                    </Text>
                    <Text style={styles.primaryButtonArrow}>↗</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { fontSize: 17 * scale }]}>一致する情報がありません</Text>
            <Text style={[styles.emptyBody, { fontSize: 14 * scale }]}>
              市町村・困りごと・キーワードを変えてください。
            </Text>
            <Pressable accessibilityRole="button" onPress={resetFilters} style={styles.emptyButton}>
              <Text style={[styles.emptyButtonText, { fontSize: 14 * scale }]}>
                条件をリセットしてすべて表示
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.localPanel}>
          <Text style={[styles.localTitle, { fontSize: 24 * scale }]}>
            通信が切れても、手順は残ります。
          </Text>
          <Text style={[styles.localBody, { fontSize: 14 * scale }]}>
            通信復旧、簡易トイレ、片付け前の写真などの行動カードはアプリ本体に保存されています。
          </Text>
          <Link href="/offline-guides" asChild>
            <Pressable accessibilityRole="link" style={styles.secondaryButton}>
              <Text style={[styles.secondaryButtonText, { fontSize: 15 * scale }]}>
                オフライン行動カードを見る
              </Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.privacyPanel}>
          <Text style={[styles.privacyTitle, { fontSize: 25 * scale }]}>
            あなたの居場所を集めません。
          </Text>
          <Text style={[styles.privacyBody, { fontSize: 14 * scale }]}>
            ログイン、GPS、住所、氏名、被害写真、健康情報、利用者投稿、広告、アクセス解析は使いません。
          </Text>
          <Link href="/about" asChild>
            <Pressable accessibilityRole="link" style={styles.aboutButton}>
              <Text style={[styles.aboutLink, { fontSize: 14 * scale }]}>安全と出典について →</Text>
            </Pressable>
          </Link>
        </View>

        <Text style={styles.footer}>
          熊本県・熊本市等の公式サービスではありません。自治体、消防、警察の指示を優先してください。
          {'\n'}
          {Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}版 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

function haystack(card: ActionCard) {
  return `${card.title} ${card.summary} ${card.steps.join(' ')} ${card.action} ${card.keywords.join(' ')}`.toLowerCase();
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.paper },
    topSafe: { backgroundColor: c.navyDeep },
    emergencyBar: {
      minHeight: 52,
      paddingHorizontal: 18,
      paddingVertical: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    emergencyLabel: { color: '#ffffff', fontWeight: '800' },
    emergencyLinks: { flexDirection: 'row', gap: 7 },
    emergencyButton: {
      minHeight: 44,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#8fa2b8',
      borderRadius: 22,
      paddingHorizontal: 14,
    },
    emergencyButtonText: { color: '#ffffff', fontWeight: '900' },
    content: { paddingBottom: 48 },
    header: { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    brandText: { flex: 1 },
    brandMark: {
      width: 42,
      height: 50,
      borderBottomLeftRadius: 15,
      borderBottomRightRadius: 15,
      backgroundColor: c.red,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandMarkText: { color: '#ffffff', fontFamily: 'serif', fontSize: 22, fontWeight: '800' },
    kicker: { color: c.muted, fontWeight: '700' },
    brandTitle: { color: c.ink, fontFamily: 'serif', fontWeight: '800' },
    textScaleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingBottom: 18,
      flexWrap: 'wrap',
    },
    textScaleLabel: { color: c.muted, fontWeight: '900' },
    textScaleButton: {
      minWidth: 56,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: 12,
    },
    textScaleButtonActive: { backgroundColor: c.navy, borderColor: c.navy },
    textScaleButtonText: { color: c.ink, fontWeight: '900' },
    textScaleButtonTextActive: { color: '#ffffff' },
    hero: {
      marginHorizontal: 16,
      marginBottom: 26,
      padding: 24,
      backgroundColor: c.navy,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 34,
    },
    heroKicker: { color: c.onNavyMuted, fontWeight: '800', letterSpacing: 1 },
    heroTitle: { color: c.onNavy, fontFamily: 'serif', fontWeight: '800', marginTop: 9 },
    freshness: {
      marginTop: 22,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.24)',
      backgroundColor: 'rgba(255, 255, 255, 0.09)',
    },
    freshnessStale: {
      borderColor: 'rgba(240, 131, 111, 0.55)',
      backgroundColor: 'rgba(240, 131, 111, 0.16)',
    },
    freshnessHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    freshnessDot: { width: 12, height: 12, borderRadius: 6 },
    freshnessText: { flex: 1 },
    freshnessTitle: { color: c.onNavy, fontWeight: '800' },
    freshnessTime: { color: c.onNavyMuted, fontFamily: 'monospace', marginTop: 3 },
    heroNote: { color: c.onNavyMuted, marginTop: 12, lineHeight: 19 },
    sectionLabel: {
      color: c.muted,
      fontWeight: '900',
      marginHorizontal: 18,
      marginBottom: 8,
      letterSpacing: 1,
    },
    needGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 22,
    },
    needCell: {
      flexGrow: 1,
      flexBasis: '30%',
      minHeight: 96,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 12,
      paddingHorizontal: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
    },
    needCellActive: { borderColor: c.navy, backgroundColor: c.chipBg },
    needIcon: { color: c.accentInk, fontFamily: 'serif', fontSize: 22, fontWeight: '900' },
    needLabel: { color: c.ink, fontWeight: '800', textAlign: 'center' },
    needLabelActive: { color: c.accentInk },
    needCount: { color: c.muted, fontFamily: 'monospace' },
    needCountActive: { color: c.accentInk },
    chips: { paddingHorizontal: 16, paddingBottom: 20, gap: 8 },
    chip: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 16,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
    },
    chipActive: { backgroundColor: c.navy, borderColor: c.navy },
    chipText: { color: c.ink, fontWeight: '800' },
    chipTextActive: { color: '#ffffff' },
    searchWrap: { paddingHorizontal: 16, paddingBottom: 22 },
    searchInput: {
      minHeight: 52,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      color: c.ink,
    },
    sectionHeader: {
      marginHorizontal: 18,
      paddingBottom: 10,
      borderBottomWidth: 2,
      borderBottomColor: c.navy,
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8,
    },
    sectionTitle: { color: c.ink, fontFamily: 'serif', fontWeight: '800', flexShrink: 1 },
    resultCount: { color: c.muted, fontFamily: 'monospace' },
    cardList: { padding: 16, gap: 14 },
    card: {
      padding: 22,
      borderRadius: 8,
      borderLeftWidth: 5,
      borderLeftColor: c.navy,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.mist,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 4,
    },
    iconText: { color: c.accentInk, fontFamily: 'serif', fontSize: 19, fontWeight: '900' },
    tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3, backgroundColor: c.chipBg },
    tagText: { color: c.muted, fontSize: 10, fontWeight: '900' },
    expiredTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3, backgroundColor: c.redSoft },
    expiredTagText: { color: c.dangerInk, fontSize: 10, fontWeight: '900' },
    cardTitle: { color: c.ink, fontWeight: '900', lineHeight: 29, marginTop: 15 },
    cardBody: { color: c.bodyText, lineHeight: 23, marginTop: 7 },
    expiredBox: {
      marginTop: 12,
      padding: 13,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: c.warnBorder,
      backgroundColor: c.warnBg,
    },
    expiredTitle: { color: c.warnInk, fontWeight: '900' },
    expiredText: { color: c.warnInk, lineHeight: 20, marginTop: 4 },
    steps: {
      marginTop: 16,
      padding: 14,
      borderRadius: 5,
      backgroundColor: c.chipBg,
      borderLeftWidth: 3,
      borderLeftColor: c.accentInk,
    },
    stepsTitle: { color: c.accentInk, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
    step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 8 },
    stepNumber: {
      width: 24,
      height: 24,
      paddingTop: 3,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: c.navy,
      textAlign: 'center',
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '900',
    },
    stepText: { flex: 1, color: c.bodyText, lineHeight: 21 },
    caution: { marginTop: 16, borderRadius: 5, padding: 13, backgroundColor: c.redSoft },
    cautionTitle: { color: c.dangerInk, fontWeight: '900' },
    cautionText: { color: c.dangerInk, lineHeight: 20, marginTop: 3 },
    sourceSummary: {
      marginTop: 14,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'space-between',
    },
    sourceSummaryText: { color: c.muted, fontFamily: 'monospace' },
    sourceSummaryExpired: { color: c.dangerInk, fontWeight: '900' },
    sourceToggle: { minHeight: 44, justifyContent: 'center', marginTop: 4 },
    sourceToggleText: { color: c.accentInk, fontWeight: '800', textDecorationLine: 'underline' },
    source: { color: c.muted, fontFamily: 'monospace', lineHeight: 17, marginBottom: 14 },
    primaryButton: {
      marginTop: 14,
      minHeight: 52,
      paddingHorizontal: 16,
      borderRadius: 5,
      backgroundColor: c.navy,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    primaryButtonText: { color: '#ffffff', fontWeight: '900', flexShrink: 1 },
    primaryButtonArrow: { color: '#ffffff', fontSize: 22 },
    emptyState: {
      margin: 16,
      padding: 24,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      gap: 8,
    },
    emptyTitle: { color: c.ink, fontWeight: '900' },
    emptyBody: { color: c.bodyText, lineHeight: 21 },
    emptyButton: {
      marginTop: 8,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 5,
      backgroundColor: c.navy,
      paddingHorizontal: 16,
    },
    emptyButtonText: { color: '#ffffff', fontWeight: '900' },
    localPanel: { margin: 16, padding: 25, borderRadius: 8, backgroundColor: c.navy },
    localTitle: { color: c.onNavy, fontFamily: 'serif', fontWeight: '800', lineHeight: 32 },
    localBody: { color: c.onNavyMuted, lineHeight: 22, marginTop: 9 },
    secondaryButton: {
      minHeight: 52,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: '#b8c8d7',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 18,
      paddingHorizontal: 16,
    },
    secondaryButtonText: { color: '#ffffff', fontWeight: '900' },
    privacyPanel: {
      marginHorizontal: 16,
      marginBottom: 24,
      padding: 25,
      backgroundColor: c.calmBg,
      borderTopRightRadius: 34,
      borderRadius: 8,
    },
    privacyTitle: { color: c.calmInk, fontFamily: 'serif', fontWeight: '800', lineHeight: 33 },
    privacyBody: { color: c.calmInk, lineHeight: 22, marginTop: 10 },
    aboutButton: { minHeight: 44, justifyContent: 'center', marginTop: 12 },
    aboutLink: { color: c.calmInk, fontWeight: '900', textDecorationLine: 'underline' },
    footer: {
      color: c.muted,
      fontSize: 11,
      lineHeight: 18,
      marginHorizontal: 20,
      paddingTop: 22,
      borderTopWidth: 1,
      borderTopColor: c.line,
    },
  });
}
