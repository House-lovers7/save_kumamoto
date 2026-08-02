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
  isLongFact,
  municipalities,
  serviceWindowNotice,
  siteCheckedAt,
  visibleFacts,
  type ActionCategory,
  type ActionCard,
} from '@/data/actions';
import {
  AREA_KEY,
  freshnessColors,
  paletteFor,
  textScaleLabels,
  textScales,
  type Palette,
} from '@/theme';
import { useTextScale } from '@/use-text-scale';

type Municipality = (typeof municipalities)[number];

const categories = Object.keys(categoryLabels) as ActionCategory[];
const needCategories = categories.filter(
  (item): item is Exclude<ActionCategory, 'all'> => item !== 'all',
);

export default function HomeScreen() {
  const scheme = useColorScheme();
  const palette = paletteFor(scheme);
  const { textScale, changeTextScale, scale } = useTextScale();
  // 行間は文字サイズに追従させる。固定のままだと「特大」で行が重なって読めない。
  const styles = useMemo(() => createStyles(palette, scale), [palette, scale]);
  // 受付時間の案内の色。強さは「言い切れるかどうか」に合わせる（lib の serviceWindowNotice と対）。
  const serviceWindowTone = {
    open: styles.serviceWindowOpen,
    waiting: styles.serviceWindowWaiting,
    closed: styles.serviceWindowClosed,
  } as const;
  const serviceWindowInk = {
    open: styles.serviceWindowInkOpen,
    waiting: styles.serviceWindowInkWaiting,
    closed: styles.serviceWindowInkClosed,
  } as const;

  const [area, setArea] = useState<Municipality>('熊本県全域');
  const [category, setCategory] = useState<ActionCategory>('all');
  const [query, setQuery] = useState('');
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  // 手順から下は既定で畳む。必要な1枚に届くまでのスクロールを短くするため。
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  // 5件を超える答えの一覧（給水所12か所など）だけを畳む。閉じたままでも件数と内訳は読める。
  const [expandedFacts, setExpandedFacts] = useState<Record<string, boolean>>({});
  // 保存情報の期限切れは時間で変わる。起動時刻で固定せず、開いたままでも切り替わるようにする。
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    AsyncStorage.getItem(AREA_KEY).then((savedArea) => {
      if (savedArea && municipalities.includes(savedArea as Municipality)) {
        setArea(savedArea as Municipality);
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

  function resetFilters() {
    setCategory('all');
    setQuery('');
  }

  function toggleSource(id: string) {
    setExpandedSources((current) => ({ ...current, [id]: !current[id] }));
  }

  function toggleDetail(id: string) {
    setExpandedDetails((current) => ({ ...current, [id]: !current[id] }));
  }

  function toggleFact(key: string) {
    setExpandedFacts((current) => ({ ...current, [key]: !current[key] }));
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
              {/* 親に読み上げ用の説明があるので、中の文字は二重に読ませない。 */}
              <Text importantForAccessibility="no-hide-descendants" style={styles.emergencyButtonText}>
                119
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="警察に110番で電話する"
              onPress={() => Linking.openURL('tel:110')}
              style={styles.emergencyButton}>
              <Text importantForAccessibility="no-hide-descendants" style={styles.emergencyButtonText}>
                警察 110
              </Text>
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
                importantForAccessibility="no-hide-descendants"
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

        {/*
          鮮度は普段1行だけ出す。期限切れが出たときにだけ見出しと説明を足す。
          常に警告文を置くと、本当に古くなったときの警告がその中に埋もれる。
        */}
        <View
          accessibilityRole="summary"
          style={[styles.freshness, freshness.tone !== 'fresh' && styles.freshnessStale]}>
          <View style={styles.freshnessHead}>
            <View
              style={[styles.freshnessDot, { backgroundColor: freshnessColors[freshness.tone] }]}
            />
            <Text style={[styles.freshnessTime, { fontSize: 12 * scale }]}>
              接続確認 {formatRelativeTime(siteCheckedAt, now)}（{formatTimestamp(siteCheckedAt)}）
            </Text>
          </View>
          {freshness.tone !== 'fresh' && (
            <View style={styles.freshnessAlert}>
              <Text style={[styles.freshnessTitle, { fontSize: 13 * scale }]}>
                {freshness.headline}
              </Text>
              <Text style={[styles.freshnessNote, { fontSize: 12 * scale }]}>{freshness.note}</Text>
            </View>
          )}
        </View>

        <View style={styles.needLead}>
          <Text style={[styles.needLeadKicker, { fontSize: 12 * scale }]}>
            令和8年熊本地震・生活支援
          </Text>
          <Text style={[styles.needLeadTitle, { fontSize: 24 * scale, lineHeight: 32 * scale }]}>
            いま困っていることは？
          </Text>
        </View>
        <View style={styles.needGrid}>
          {needCategories.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: category === item }}
              accessibilityLabel={`${categoryLabels[item]} ${countsByCategory.get(item) ?? 0}件`}
              onPress={() => setCategory(item)}
              style={[styles.needCell, category === item && styles.needCellActive]}>
              {/* accessibilityLabel が「◯◯ N件」を読むので、中の2つは読み上げから外す。 */}
              <Text
                importantForAccessibility="no-hide-descendants"
                style={[
                  styles.needLabel,
                  category === item && styles.needLabelActive,
                  { fontSize: 14 * scale },
                ]}>
                {categoryLabels[item]}
              </Text>
              <Text
                importantForAccessibility="no-hide-descendants"
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
              // 受付時間の案内は期限内のカードにだけ出す。期限切れの表示とは排他で、
              // 「確認できません」と「受付時間内です」を同時に並べない。
              const windowNotice = !expired ? serviceWindowNotice(item, now) : null;
              const sourceOpen = expandedSources[item.id] === true;
              const detailOpen = expandedDetails[item.id] === true;
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
                    {/* 確認できていないカードに「公式情報」と付けると、行けば分かると誤解させる。 */}
                    {item.sourceStatus === 'unavailable' ? (
                      <View style={styles.unverifiedTag}>
                        <Text style={styles.unverifiedTagText}>未確認</Text>
                      </View>
                    ) : (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>公式情報</Text>
                      </View>
                    )}
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

                  {/*
                    期限（この情報を信じてよいか）とは別に、受付時間（行けば受け取れるか）を出す。
                    期限内でも、氷川町の配布なら 11:00〜15:00 は誰もいない。ここを出さないと
                    アプリが閉まっている場所へ人を向かわせる。着いたら終わっていた、は
                    被災者にとって心理的にも体力的にも損失が最も大きい失敗なので、手順より先に出す。
                  */}
                  {windowNotice && (
                    <View
                      accessibilityRole="summary"
                      style={[styles.serviceWindow, serviceWindowTone[windowNotice.tone]]}
                    >
                      <Text
                        style={[
                          styles.serviceWindowTitle,
                          serviceWindowInk[windowNotice.tone],
                          { fontSize: 14 * scale },
                        ]}
                      >
                        {windowNotice.headline}
                      </Text>
                      <Text
                        style={[
                          styles.serviceWindowText,
                          serviceWindowInk[windowNotice.tone],
                          { fontSize: 13 * scale },
                        ]}
                      >
                        {windowNotice.detail}
                      </Text>
                    </View>
                  )}

                  {/*
                    リンクは生きているが、そのページにこの話題の案内が無い状態。
                    黙って通常のカードとして出すと「行けば分かる」と誤解させるので、
                    手順より先に、何が確認できていないのかを本文として出す。
                  */}
                  {item.sourceStatus === 'unavailable' && (
                    <View style={styles.unverifiedNotice}>
                      <Text style={[styles.unverifiedTitle, { fontSize: 14 * scale }]}>
                        公式の案内を確認できていません
                      </Text>
                      <Text style={[styles.unverifiedText, { fontSize: 13 * scale }]}>
                        {item.unverified}
                      </Text>
                    </View>
                  )}

                  {/*
                    出典に書かれている答えそのもの。リンク先で探させないためにカード内へ出す。
                    畳んだ状態でも読める位置に置く（2026-08-01 ユーザー確定）。
                    その日限りの答え（dated）は期限切れで消す。「8月1日の給水所」を翌日も
                    見せることは、終了した場所へ人を向かわせることと同じ。
                    日付に依存しない答え（問い合わせ先など）は、期限切れでも残す。
                  */}
                  {visibleFacts(item, now).map((fact) => {
                    const factKey = `${item.id}/${fact.label}`;
                    const long = isLongFact(fact);
                    const factOpen = expandedFacts[factKey] === true;
                    return (
                      <View key={factKey} style={styles.facts}>
                        {long ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ expanded: factOpen }}
                            accessibilityLabel={fact.label}
                            onPress={() => toggleFact(factKey)}
                            style={styles.factsToggle}>
                            <Text
                              importantForAccessibility="no-hide-descendants"
                              style={[styles.factsToggleText, { fontSize: 14 * scale }]}>
                              {fact.label}
                            </Text>
                            <Text
                              importantForAccessibility="no-hide-descendants"
                              style={styles.factsToggleMark}>
                              {factOpen ? '▲' : '▼'}
                            </Text>
                          </Pressable>
                        ) : (
                          <Text style={[styles.factsLabel, { fontSize: 14 * scale }]}>
                            {fact.label}
                          </Text>
                        )}
                        {(!long || factOpen) && (
                          <View style={styles.factsList}>
                            {fact.items.map((value) => (
                              <View key={value} style={styles.factsItem}>
                                <Text style={styles.factsBullet}>・</Text>
                                <Text style={[styles.factsItemText, { fontSize: 14 * scale }]}>
                                  {value}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                        <Text style={[styles.factsCite, { fontSize: 11 * scale }]}>
                          出典の「{fact.citedAs}」より
                        </Text>
                      </View>
                    );
                  })}

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

                  {/*
                    手順から下は畳む。畳んだ状態でも、要約・有効期限・「未確認」の警告・
                    公式サイトへのボタンは残す。閉じたまま行動できる材料は隠さない。
                  */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: detailOpen }}
                    accessibilityLabel={`${item.title}の手順と注意`}
                    onPress={() => toggleDetail(item.id)}
                    style={styles.detailToggle}>
                    <Text
                      importantForAccessibility="no-hide-descendants"
                      style={[styles.detailToggleText, { fontSize: 14 * scale }]}>
                      手順と注意を見る
                    </Text>
                    <Text
                      importantForAccessibility="no-hide-descendants"
                      style={styles.detailToggleMark}>
                      {detailOpen ? '▲' : '▼'}
                    </Text>
                  </Pressable>

                  {detailOpen && (
                  <>
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

                  {/*
                    混同すると健康被害・無駄足につながる区別。期限切れでも隠さない。
                    「飲料用か生活用水か」は、期限が切れても確認すべきことに変わりがない。
                  */}
                  {item.verifyPoints?.map((point) => (
                    <View key={point.label} style={styles.verifyPoint}>
                      <Text style={[styles.verifyPointTitle, { fontSize: 14 * scale }]}>
                        公式ページで必ず確認する: {point.label}
                      </Text>
                      <View style={styles.verifyPointOptions}>
                        {point.options.map((option) => (
                          <View key={option} style={styles.verifyPointOption}>
                            <Text style={[styles.verifyPointOptionText, { fontSize: 13 * scale }]}>
                              {option}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <Text style={[styles.verifyPointWhy, { fontSize: 13 * scale }]}>
                        {point.why}
                      </Text>
                    </View>
                  ))}

                  {/* 順序を誤ると取り返しがつかない手続き。番号を残して順番であることを示す。 */}
                  {item.irreversibleOrder && (
                    <View style={styles.irreversibleOrder}>
                      <Text style={[styles.irreversibleTitle, { fontSize: 14 * scale }]}>
                        順番を間違えると取り返しがつきません
                      </Text>
                      {item.irreversibleOrder.map((entry, index) => (
                        <View key={entry} style={styles.irreversibleItem}>
                          <Text style={[styles.irreversibleNumber, { fontSize: 13 * scale }]}>
                            {index + 1}.
                          </Text>
                          <Text style={[styles.irreversibleText, { fontSize: 13 * scale }]}>
                            {entry}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.caution}>
                    <Text style={[styles.cautionTitle, { fontSize: 12 * scale }]}>注意</Text>
                    <Text style={[styles.cautionText, { fontSize: 13 * scale }]}>{item.caution}</Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: sourceOpen }}
                    accessibilityLabel={`${item.title}の出典と時刻の詳細`}
                    onPress={() => toggleSource(item.id)}
                    style={styles.sourceToggle}>
                    <Text
                      importantForAccessibility="no-hide-descendants"
                      style={[styles.sourceToggleText, { fontSize: 13 * scale }]}>
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
                  </>
                  )}

                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`${item.action}（外部の公式サイト）`}
                    onPress={() => openOfficial(item.sourceUrl, item.sourceName)}
                    style={styles.primaryButton}>
                    <Text
                      importantForAccessibility="no-hide-descendants"
                      style={[styles.primaryButtonText, { fontSize: 15 * scale }]}>
                      {item.action}
                    </Text>
                    <Text importantForAccessibility="no-hide-descendants" style={styles.primaryButtonArrow}>
                      ↗
                    </Text>
                  </Pressable>

                  {/*
                    深いURLが存在しない出典で、開いた最初の画面から探す先を名指しする。
                    文言は出典の実物からの引用で、巡回のたびに照合する。
                  */}
                  {item.sourceLandmark && (
                    <Text style={[styles.landmark, { fontSize: 13 * scale }]}>
                      開いたページで「{item.sourceLandmark}」を探してください。
                    </Text>
                  )}
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

function createStyles(c: Palette, scale: number) {
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
      minHeight: 48,
      paddingVertical: 10,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#8fa2b8',
      borderRadius: 22,
      paddingHorizontal: 14,
    },
    // 119 / 110 は最優先の導線。文字を大きくした人にはここも大きくする。
    emergencyButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 14 * scale },
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
      minHeight: 48,
      paddingVertical: 10,
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
    // 鮮度は1行のバー。期限切れが出たときだけ警告色へ変わり、説明が下に増える。
    freshness: {
      marginHorizontal: 16,
      marginBottom: 20,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
    },
    freshnessStale: {
      borderColor: c.warnBorder,
      backgroundColor: c.warnBg,
    },
    freshnessHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    freshnessDot: { width: 10, height: 10, borderRadius: 5 },
    freshnessTime: { color: c.muted, fontFamily: 'monospace', flexShrink: 1 },
    freshnessAlert: { marginTop: 8 },
    freshnessTitle: { color: c.warnInk, fontWeight: '800' },
    freshnessNote: { color: c.warnInk, marginTop: 4, lineHeight: 19 * scale },
    needLead: { marginHorizontal: 18, marginBottom: 12 },
    needLeadKicker: { color: c.muted, fontWeight: '800', letterSpacing: 1 },
    needLeadTitle: { color: c.ink, fontFamily: 'serif', fontWeight: '800', marginTop: 4 },
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
      // 漢字1文字を外した分だけ詰める。48dp は大きく上回るのでタップ領域は保てる。
      minHeight: 72,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
    },
    needCellActive: { borderColor: c.navy, backgroundColor: c.chipBg },
    needLabel: { color: c.ink, fontWeight: '800', textAlign: 'center' },
    needLabelActive: { color: c.accentInk },
    needCount: { color: c.muted, fontFamily: 'monospace' },
    needCountActive: { color: c.accentInk },
    chips: { paddingHorizontal: 16, paddingBottom: 20, gap: 8 },
    chip: {
      // 横スクロールの中では minHeight だけだと実描画が 44dp を割る（実測 34.7dp）。
      // paddingVertical で中身から高さを作り、48dp を確実に満たす。
      minHeight: 48,
      paddingVertical: 12,
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
    resultCount: { color: c.muted, fontFamily: 'monospace', fontSize: 14 * scale },
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
    tagText: { color: c.muted, fontSize: 10 * scale, fontWeight: '900' },
    // 「未確認」は Web の .action-card__meta .is-unverified と同じ黄系。注意（赤系）と分ける。
    unverifiedTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3, backgroundColor: c.warnBg },
    unverifiedTagText: { color: c.warnInk, fontSize: 10 * scale, fontWeight: '900' },
    expiredTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3, backgroundColor: c.redSoft },
    // 「期限切れ」は鮮度の警告そのもの。小さいまま置き去りにしない。
    expiredTagText: { color: c.dangerInk, fontSize: 10 * scale, fontWeight: '900' },
    cardTitle: { color: c.ink, fontWeight: '900', lineHeight: 29 * scale, marginTop: 15 },
    cardBody: { color: c.bodyText, lineHeight: 23 * scale, marginTop: 7 },
    expiredBox: {
      marginTop: 12,
      padding: 13,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: c.warnBorder,
      backgroundColor: c.warnBg,
    },
    expiredTitle: { color: c.warnInk, fontWeight: '900' },
    expiredText: { color: c.warnInk, lineHeight: 20 * scale, marginTop: 4 },
    /*
      公式ページに案内が無いことの表示。手順より前に出るので、警告色の中でも
      「危険」ではなく「欠けている」と読める黄系（warn*）を使い、注意（赤系）と分ける。
    */
    unverifiedNotice: {
      marginTop: 12,
      padding: 14,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: c.warnBorder,
      backgroundColor: c.warnBg,
    },
    unverifiedTitle: { color: c.warnInk, fontWeight: '900' },
    unverifiedText: { color: c.warnInk, lineHeight: 20 * scale, marginTop: 4 },
    /*
      受付時間の案内。期限（この情報を信じてよいか）とは別に、行けば受け取れる時間かを出す。

      色の強さは「言い切れるかどうか」に合わせる。受付時間外は告知の時刻からの帰結なので
      言い切ってよく、無駄足を止める表示なので最も強い赤系にする。受付時間内は中止・
      早期終了がありうるので言い切れない。緑を成功色として使うと「行けば必ずもらえる」と
      読ませてしまうため、控えめな calm* に留めて断定を文言側だけに任せる。
    */
    serviceWindow: {
      marginTop: 12,
      padding: 13,
      borderRadius: 5,
      borderWidth: 2,
    },
    serviceWindowOpen: { borderColor: c.calmInk, backgroundColor: c.calmBg },
    serviceWindowWaiting: { borderColor: c.warnBorder, backgroundColor: c.warnBg },
    serviceWindowClosed: { borderColor: c.red, backgroundColor: c.redSoft },
    serviceWindowInkOpen: { color: c.calmInk },
    serviceWindowInkWaiting: { color: c.warnInk },
    serviceWindowInkClosed: { color: c.dangerInk },
    serviceWindowTitle: { fontWeight: '900' },
    serviceWindowText: { lineHeight: 20 * scale, marginTop: 4 },
    /*
      出典に書かれている答えそのもの（場所・時間・住所・電話番号）。畳んだ状態でも
      読める位置に出るので、手順（steps）より紙面の重みを強くし、カードを開かなくても
      最初に目へ入るようにする。左の縦線は navy で「ここが答え」と分からせる。
    */
    facts: {
      marginTop: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: c.line,
      borderLeftWidth: 6,
      borderLeftColor: c.navy,
      backgroundColor: c.paper,
    },
    factsLabel: { color: c.accentInk, fontWeight: '900', lineHeight: 21 * scale },
    // 5件を超える一覧の開閉。閉じたままでも件数と内訳が読めるラベルを出す（48dp）。
    factsToggle: {
      minHeight: 48,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.chipBg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    factsToggleText: {
      color: c.accentInk,
      fontWeight: '900',
      flexShrink: 1,
      lineHeight: 20 * scale,
    },
    factsToggleMark: { color: c.accentInk, fontSize: 12, fontWeight: '900' },
    factsList: { marginTop: 10, gap: 8 },
    factsItem: { flexDirection: 'row', alignItems: 'flex-start' },
    factsBullet: { color: c.navy, fontWeight: '900' },
    factsItemText: { flex: 1, color: c.ink, fontWeight: '700', lineHeight: 21 * scale },
    factsCite: { color: c.muted, fontWeight: '700', marginTop: 10 },
    // リンク先で探す場所の名指し。公式サイトのボタンの直下に置く。
    landmark: { color: c.bodyText, fontWeight: '700', lineHeight: 20 * scale, marginTop: 8 },
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
    stepText: { flex: 1, color: c.bodyText, lineHeight: 21 * scale },
    /*
      混同すると健康被害・無駄足につながる区別。読み飛ばされると意味がないので、
      手順と同じ紙面の重みを持たせつつ、左の縦線で「ここは確認項目」と分からせる。
    */
    verifyPoint: {
      marginTop: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: c.line,
      borderLeftWidth: 6,
      borderLeftColor: c.warnBorder,
      backgroundColor: c.paper,
    },
    verifyPointTitle: { color: c.accentInk, fontWeight: '900', lineHeight: 21 * scale },
    verifyPointOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    verifyPointOption: {
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.chipBg,
    },
    verifyPointOptionText: { color: c.accentInk, fontWeight: '900' },
    verifyPointWhy: { color: c.bodyText, lineHeight: 21 * scale, marginTop: 10 },
    // 順序を誤ると取り返しがつかない手続き。番号を残して順番であることを示す。
    irreversibleOrder: {
      marginTop: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: c.warnBorder,
      backgroundColor: c.warnBg,
    },
    irreversibleTitle: { color: c.warnInk, fontWeight: '900' },
    irreversibleItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 8 },
    irreversibleNumber: { color: c.warnInk, fontWeight: '900' },
    irreversibleText: { flex: 1, color: c.warnInk, lineHeight: 21 * scale },
    caution: { marginTop: 16, borderRadius: 5, padding: 13, backgroundColor: c.redSoft },
    cautionTitle: { color: c.dangerInk, fontWeight: '900' },
    cautionText: { color: c.dangerInk, lineHeight: 20 * scale, marginTop: 3 },
    sourceSummary: {
      marginTop: 14,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'space-between',
    },
    sourceSummaryText: { color: c.muted, fontFamily: 'monospace' },
    sourceSummaryExpired: { color: c.dangerInk, fontWeight: '900' },
    // 既定で閉じている開閉。開く操作子だと分かる大きさと当たり判定（48dp）を持たせる。
    detailToggle: {
      minHeight: 48,
      marginTop: 14,
      paddingHorizontal: 14,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.chipBg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    detailToggleText: { color: c.accentInk, fontWeight: '900', flexShrink: 1 },
    detailToggleMark: { color: c.accentInk, fontSize: 12, fontWeight: '900' },
    sourceToggle: { minHeight: 44, justifyContent: 'center', marginTop: 4 },
    sourceToggleText: { color: c.accentInk, fontWeight: '800', textDecorationLine: 'underline' },
    source: { color: c.muted, fontFamily: 'monospace', lineHeight: 17 * scale, marginBottom: 14 },
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
    emptyBody: { color: c.bodyText, lineHeight: 21 * scale },
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
    localTitle: { color: c.onNavy, fontFamily: 'serif', fontWeight: '800', lineHeight: 32 * scale },
    localBody: { color: c.onNavyMuted, lineHeight: 22 * scale, marginTop: 9 },
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
    privacyTitle: { color: c.calmInk, fontFamily: 'serif', fontWeight: '800', lineHeight: 33 * scale },
    privacyBody: { color: c.calmInk, lineHeight: 22 * scale, marginTop: 10 },
    aboutButton: { minHeight: 44, justifyContent: 'center', marginTop: 12 },
    aboutLink: { color: c.calmInk, fontWeight: '900', textDecorationLine: 'underline' },
    footer: {
      color: c.muted,
      // 「公式サービスではありません」の断り書き。ここだけ小さいままにしない。
      fontSize: 11 * scale,
      lineHeight: 18 * scale,
      marginHorizontal: 20,
      paddingTop: 22,
      borderTopWidth: 1,
      borderTopColor: c.line,
    },
  });
}
