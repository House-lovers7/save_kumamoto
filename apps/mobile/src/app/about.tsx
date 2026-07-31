import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { paletteFor, type Palette } from '@/theme';
import { useTextScale } from '@/use-text-scale';

export default function AboutScreen() {
  const palette = paletteFor(useColorScheme());
  const { scale } = useTextScale();
  const styles = useMemo(() => createStyles(palette, scale), [palette, scale]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>安全側に縮退する設計</Text>
        <Text style={styles.lead}>このアプリは、情報がないときに「利用可能」と推測しません。</Text>
        {[
          ['収集しない情報', 'GPS、住所、氏名、電話番号、健康情報、被害写真、閲覧履歴を収集しません。'],
          ['状態の断定', '営業、在庫、通行、医療受入を独自に断定しません。出典と確認時刻を示して公式情報へ案内します。'],
          ['AIの役割', 'AIが避難、医療、道路、支援の可否を決める機能はありません。'],
          ['外部サイト', '公式リンク先では、その提供者のプライバシーポリシーとCookie設定が適用されます。'],
          ['緊急時', '自治体、消防、警察、医療機関の指示がこのアプリより優先されます。'],
        ].map(([heading, body]) => (
          <View key={heading} style={styles.section}>
            <Text style={styles.heading}>{heading}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        ))}
        <View style={styles.notice}>
          <Text style={styles.noticeText}>運営主体と現地の訂正体制が確立するまで、個人投稿・支援要請・寄付・配送機能は公開しません。</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: Palette, scale: number) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paper },
    content: { padding: 20, paddingBottom: 48 },
    title: { color: c.ink, fontFamily: 'serif', fontSize: 31 * scale, lineHeight: 40 * scale, fontWeight: '800' },
    lead: { color: c.bodyText, fontSize: 16 * scale, lineHeight: 25 * scale, marginTop: 12, marginBottom: 24 },
    section: { paddingVertical: 18, borderTopWidth: 1, borderTopColor: c.line },
    heading: { color: c.accentInk, fontSize: 17 * scale, lineHeight: 23 * scale, fontWeight: '900' },
    body: { color: c.bodyText, fontSize: 15 * scale, lineHeight: 24 * scale, marginTop: 6 },
    notice: { padding: 18, borderRadius: 7, backgroundColor: c.calmBg, marginTop: 16 },
    noticeText: { color: c.calmInk, fontSize: 14 * scale, lineHeight: 22 * scale, fontWeight: '700' },
  });
}
