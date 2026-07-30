import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { paletteFor, type Palette } from '@/theme';

const guides = [
  {
    title: '通信できない',
    steps: ['機内モードを一度切り替える', '通信会社のJAPANローミング™案内を確認する', '公衆電話・171・避難所の通信手段を試す', '手動選択を使った場合は、復旧後に自動へ戻す'],
    warning: '00000JAPANは暗号化されていません。個人情報やパスワードを入力しないでください。',
  },
  {
    title: '片付けを始める',
    steps: ['建物の外側を4方向から撮る', '各部屋の全景を撮る', '被災箇所を近くから撮る', '片付け・修理・支払いの前に自治体へ確認する'],
    warning: '表札、顔、書類番号、位置情報が分かる写真を一般共有しないでください。',
  },
  {
    title: 'トイレが使えない',
    steps: ['便器の排水可否を自治体情報で確認する', '大きな袋を二重にかぶせる', '吸水材を入れ、使用後は口を固く結ぶ', '保管・収集方法を自治体の指示で確認する'],
    warning: '断水時に水を流すと逆流する場合があります。自治体の案内を優先してください。',
  },
  {
    title: '薬が必要',
    steps: ['薬の名前・量・服用時刻をメモする', 'お薬手帳や薬袋があれば持つ', '県・市の診療可能情報を確認する', '命の危険がある場合は119番へ電話する'],
    warning: '薬の変更・中断をこのアプリだけで判断しないでください。',
  },
];

export default function OfflineGuidesScreen() {
  const palette = paletteFor(useColorScheme());
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>端末に保存済み</Text>
          <Text style={styles.title}>通信がなくても読める行動カード</Text>
          <Text style={styles.introText}>一般的な手順です。オンラインに戻ったら、必ず自治体・関係機関の最新情報を確認してください。</Text>
        </View>
        {guides.map((guide) => (
          <View key={guide.title} style={styles.card}>
            <Text style={styles.cardTitle}>{guide.title}</Text>
            {guide.steps.map((step, index) => (
              <View key={step} style={styles.step}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
            <View style={styles.warning}><Text style={styles.warningText}>{guide.warning}</Text></View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paper },
    content: { padding: 16, gap: 14, paddingBottom: 40 },
    intro: { padding: 23, borderRadius: 8, borderBottomRightRadius: 34, backgroundColor: c.navy },
    eyebrow: { color: c.onNavyMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    title: { color: c.onNavy, fontFamily: 'serif', fontSize: 29, lineHeight: 38, fontWeight: '800', marginTop: 8 },
    introText: { color: c.onNavyMuted, fontSize: 14, lineHeight: 22, marginTop: 12 },
    card: { backgroundColor: c.surface, borderRadius: 8, padding: 21, borderWidth: 1, borderColor: c.line, borderLeftWidth: 5, borderLeftColor: c.navy },
    cardTitle: { color: c.ink, fontFamily: 'serif', fontSize: 23, fontWeight: '800', marginBottom: 16 },
    step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 13 },
    stepNumber: { width: 29, height: 29, paddingTop: 4, borderRadius: 15, overflow: 'hidden', backgroundColor: c.mist, textAlign: 'center', color: c.accentInk, fontWeight: '900' },
    stepText: { flex: 1, color: c.bodyText, fontSize: 15, lineHeight: 23 },
    warning: { marginTop: 5, borderRadius: 5, padding: 13, backgroundColor: c.redSoft },
    warningText: { color: c.dangerInk, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  });
}
