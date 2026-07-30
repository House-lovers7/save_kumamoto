// このファイルは自動生成です。直接編集しないでください。
// 正典: lib/disaster-data.ts
// 再生成: npm run gen:mobile-data （リポジトリルートで実行）

export type ActionCategory =
  | "all"
  | "emergency"
  | "water"
  | "essentials"
  | "shelter"
  | "medical"
  | "communication"
  | "transport"
  | "recovery";

export type SourceStatus = "official" | "unavailable" | "conflict";

export type ActionCard = {
  id: string;
  category: Exclude<ActionCategory, "all">;
  icon: string;
  title: string;
  summary: string;
  steps: string[];
  /** 検索用の言い換え。かな・漢字・話し言葉で探しても同じカードへ着くようにする。 */
  keywords: string[];
  action: string;
  caution: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  fetchedAt: string;
  checkedAt: string;
  expiresAt: string;
  sourceStatus: SourceStatus;
  areas: string[];
  offline: boolean;
};

export const municipalities = [
  "熊本県全域",
  "熊本市",
  "宇城市",
  "宇土市",
  "八代市",
  "氷川町",
  "その他の市町村",
] as const;

export const categoryLabels: Record<ActionCategory, string> = {
  "all": "すべて",
  "emergency": "緊急・安全",
  "water": "水・給水",
  "essentials": "食料・生活",
  "shelter": "避難所",
  "medical": "薬・医療",
  "communication": "連絡・充電",
  "transport": "移動・道路",
  "recovery": "片付け・制度",
};

export const actionCards: ActionCard[] = [
  {
    "id": "official-kumamoto",
    "category": "emergency",
    "icon": "公",
    "title": "熊本県の最新情報を確認する",
    "summary": "県の災害情報、被害状況、支援情報を確認します。古い画面を開いている場合は更新日時も見てください。",
    "steps": [
      "命の危険があるときは、まず119・110に電話する",
      "県の公式ページで最新の発表時刻を確認する",
      "自分の市町村のページも合わせて確認する"
    ],
    "keywords": [
      "県",
      "災害",
      "さいがい",
      "地震",
      "じしん",
      "被害",
      "ひがい",
      "支援",
      "しえん",
      "お知らせ"
    ],
    "action": "熊本県公式の防災情報を開く",
    "caution": "このアプリは県や市の公式サービスではありません。",
    "sourceName": "熊本県 防災推進課",
    "sourceUrl": "https://www.pref.kumamoto.jp/soshiki/222/",
    "publishedAt": "2026-07-30T09:35:00+09:00",
    "fetchedAt": "2026-07-30T09:35:00+09:00",
    "checkedAt": "2026-07-30T09:35:00+09:00",
    "expiresAt": "2026-07-30T13:35:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本県全域"
    ],
    "offline": false
  },
  {
    "id": "kumamoto-city-hub",
    "category": "emergency",
    "icon": "市",
    "title": "熊本市の地震情報をまとめて見る",
    "summary": "避難所、施設休止、災害ごみ、り災証明など、熊本市の令和8年熊本地震情報を確認します。",
    "steps": [
      "知りたい項目（避難所・ごみ・り災証明など）を決める",
      "公式ページで項目ごとの更新時刻を確認する",
      "窓口へ行く前に受付時間と場所を確認する"
    ],
    "keywords": [
      "市",
      "市役所",
      "しやくしょ",
      "くまもとし",
      "罹災",
      "り災",
      "りさい",
      "ごみ",
      "休止"
    ],
    "action": "熊本市公式の集約ページを開く",
    "caution": "項目ごとに発表時刻が異なります。各ページの更新時刻を確認してください。",
    "sourceName": "熊本市",
    "sourceUrl": "https://www.city.kumamoto.jp/list04828.html",
    "publishedAt": "2026-07-30T09:35:00+09:00",
    "fetchedAt": "2026-07-30T09:35:00+09:00",
    "checkedAt": "2026-07-30T09:35:00+09:00",
    "expiresAt": "2026-07-30T13:35:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本市"
    ],
    "offline": false
  },
  {
    "id": "water",
    "category": "water",
    "icon": "水",
    "title": "給水所へ向かう前に確認する",
    "summary": "開設場所だけでなく、実施時間、容器の要否、配布上限、給水車の一時不在を確認します。",
    "steps": [
      "公式ページで開設中の給水所と実施時間を確認する",
      "容器（ポリタンク・ペットボトル）を用意する",
      "出発の直前に、もう一度最新情報を確認する"
    ],
    "keywords": [
      "みず",
      "水道",
      "すいどう",
      "断水",
      "だんすい",
      "給水",
      "きゅうすい",
      "ポリタンク",
      "飲み水",
      "蛇口"
    ],
    "action": "市町村の公式災害ページを確認する",
    "caution": "「登録施設」と「現在使える施設」は別です。公式に利用可能と確認できない場所へ向かわないでください。",
    "sourceName": "熊本県・各市町村公式情報",
    "sourceUrl": "https://www.pref.kumamoto.jp/soshiki/222/",
    "publishedAt": "2026-07-30T09:35:00+09:00",
    "fetchedAt": "2026-07-30T09:35:00+09:00",
    "checkedAt": "2026-07-30T09:35:00+09:00",
    "expiresAt": "2026-07-30T13:35:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本県全域",
      "熊本市",
      "宇城市",
      "宇土市",
      "八代市",
      "氷川町"
    ],
    "offline": true
  },
  {
    "id": "food-and-supplies",
    "category": "essentials",
    "icon": "食",
    "title": "水・食料・生活用品の入手先を確認する",
    "summary": "店舗営業、自治体配布、配送受付は別々に変化します。市町村の公式案内と事業者公式情報を確認します。",
    "steps": [
      "市町村の公式案内で配布場所と時間を確認する",
      "店舗は公式サイト・公式SNSの営業情報を確認する",
      "移動の前に道路状況も確認する"
    ],
    "keywords": [
      "ごはん",
      "ご飯",
      "食べ物",
      "たべもの",
      "食料",
      "しょくりょう",
      "日用品",
      "買い物",
      "かいもの",
      "スーパー",
      "コンビニ",
      "おなか",
      "物資"
    ],
    "action": "熊本県の生活支援情報を確認する",
    "caution": "このアプリは在庫や到着時刻を保証しません。古い営業情報だけで移動・注文しないでください。",
    "sourceName": "熊本県・各市町村公式情報",
    "sourceUrl": "https://www.pref.kumamoto.jp/soshiki/222/",
    "publishedAt": "2026-07-30T09:35:00+09:00",
    "fetchedAt": "2026-07-30T09:35:00+09:00",
    "checkedAt": "2026-07-30T09:35:00+09:00",
    "expiresAt": "2026-07-30T13:35:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本県全域"
    ],
    "offline": true
  },
  {
    "id": "fuel",
    "category": "essentials",
    "icon": "油",
    "title": "給油できる場所を公式情報で確認する",
    "summary": "営業、給油制限、支払方法、道路規制を別々に確認し、出発直前に状況を見直します。",
    "steps": [
      "残量に余裕があるうちに給油の計画を立てる",
      "公式情報で営業・給油制限・支払方法を確認する",
      "出発の直前に道路規制を確認する"
    ],
    "keywords": [
      "ガソリン",
      "がそりん",
      "燃料",
      "ねんりょう",
      "車",
      "くるま",
      "スタンド",
      "給油",
      "きゅうゆ",
      "灯油"
    ],
    "action": "熊本県の災害情報を確認する",
    "caution": "営業中・在庫ありとは断定しません。補給時刻や在庫量をSNSへ転載しないでください。",
    "sourceName": "熊本県・事業者公式情報",
    "sourceUrl": "https://www.pref.kumamoto.jp/soshiki/222/",
    "publishedAt": "2026-07-30T09:35:00+09:00",
    "fetchedAt": "2026-07-30T09:35:00+09:00",
    "checkedAt": "2026-07-30T09:35:00+09:00",
    "expiresAt": "2026-07-30T13:35:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本県全域"
    ],
    "offline": true
  },
  {
    "id": "toilet",
    "category": "essentials",
    "icon": "便",
    "title": "トイレが使えないときの安全な手順",
    "summary": "下水・浄化槽の状況を確認し、携帯トイレや袋を使う場合は自治体の収集・保管方法に従います。",
    "steps": [
      "断水中は便器に水を流さない（逆流の危険）",
      "携帯トイレやごみ袋+吸水材で代用する",
      "使用後のごみの出し方は自治体の案内に従う"
    ],
    "keywords": [
      "といれ",
      "便所",
      "べんじょ",
      "下水",
      "げすい",
      "排水",
      "はいすい",
      "携帯トイレ",
      "汚水",
      "流せない"
    ],
    "action": "市町村の断水・ごみ情報を確認する",
    "caution": "断水時に便器へ水を流すと逆流する場合があります。自治体の案内を優先してください。",
    "sourceName": "熊本県・各市町村公式情報",
    "sourceUrl": "https://www.pref.kumamoto.jp/soshiki/222/",
    "publishedAt": "2026-07-30T09:35:00+09:00",
    "fetchedAt": "2026-07-30T09:35:00+09:00",
    "checkedAt": "2026-07-30T09:35:00+09:00",
    "expiresAt": "2026-07-30T13:35:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本県全域"
    ],
    "offline": true
  },
  {
    "id": "infant-care",
    "category": "essentials",
    "icon": "子",
    "title": "乳幼児用品と子育て支援を確認する",
    "summary": "ミルク、離乳食、おむつ、授乳・休憩場所、休止施設の代替窓口を公式案内から確認します。",
    "steps": [
      "公式案内でミルク・おむつなどの配布先を確認する",
      "授乳・休憩場所は市町村の窓口に確認する",
      "体調が心配なときは医療機関・相談窓口へ連絡する"
    ],
    "keywords": [
      "こども",
      "子供",
      "子ども",
      "赤ちゃん",
      "あかちゃん",
      "ベビー",
      "ミルク",
      "おむつ",
      "オムツ",
      "授乳",
      "じゅにゅう",
      "離乳食",
      "乳児",
      "幼児",
      "保育",
      "おしりふき"
    ],
    "action": "熊本県の子育て・生活支援情報を確認する",
    "caution": "乳幼児の体調をこのアプリで判断しません。心配な症状は医療機関や公的相談先へ確認してください。",
    "sourceName": "熊本県・各市町村公式情報",
    "sourceUrl": "https://www.pref.kumamoto.jp/soshiki/222/",
    "publishedAt": "2026-07-30T09:35:00+09:00",
    "fetchedAt": "2026-07-30T09:35:00+09:00",
    "checkedAt": "2026-07-30T09:35:00+09:00",
    "expiresAt": "2026-07-30T13:35:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本県全域"
    ],
    "offline": true
  },
  {
    "id": "elder-care",
    "category": "essentials",
    "icon": "介",
    "title": "高齢者・介護の支援継続先を確認する",
    "summary": "介護、食事、入浴、服薬、移動支援について、休止施設と自治体の代替相談窓口を確認します。",
    "steps": [
      "利用中の事業所に休止・代替の予定を確認する",
      "つながらないときは市町村の相談窓口へ連絡する",
      "薬が切れそうなときは早めに医療機関へ相談する"
    ],
    "keywords": [
      "高齢",
      "こうれい",
      "お年寄り",
      "としより",
      "年寄り",
      "介護",
      "かいご",
      "デイサービス",
      "ヘルパー",
      "認知症",
      "入浴",
      "お風呂",
      "おふろ",
      "施設",
      "親"
    ],
    "action": "熊本県の高齢者・福祉情報を確認する",
    "caution": "氏名、病名、服薬、居場所を公開画面やSNSへ投稿しないでください。",
    "sourceName": "熊本県・各市町村公式情報",
    "sourceUrl": "https://www.pref.kumamoto.jp/soshiki/222/",
    "publishedAt": "2026-07-30T09:35:00+09:00",
    "fetchedAt": "2026-07-30T09:35:00+09:00",
    "checkedAt": "2026-07-30T09:35:00+09:00",
    "expiresAt": "2026-07-30T13:35:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本県全域"
    ],
    "offline": true
  },
  {
    "id": "shelter",
    "category": "shelter",
    "icon": "避",
    "title": "避難所の開設・条件を確認する",
    "summary": "開設状況に加え、ペット同伴、車中泊、車椅子、乳幼児、充電などの利用条件を確認します。",
    "steps": [
      "公式ページで開設中の避難所を確認する",
      "ペット・車中泊・車椅子などの条件を確認する",
      "移動が難しいときは市町村へ相談する"
    ],
    "keywords": [
      "ひなん",
      "避難",
      "避難所",
      "ひなんじょ",
      "ペット",
      "車中泊",
      "しゃちゅうはく",
      "寝る",
      "ねる",
      "泊まる",
      "とまる",
      "居場所",
      "体育館"
    ],
    "action": "熊本市の避難所情報を開く",
    "caution": "混雑や設備は変化します。個人の避難先や避難者名をSNSへ投稿しないでください。",
    "sourceName": "熊本市 防災サイト",
    "sourceUrl": "https://www.city.kumamoto.jp/default.html",
    "publishedAt": "2026-07-30T09:35:00+09:00",
    "fetchedAt": "2026-07-30T09:35:00+09:00",
    "checkedAt": "2026-07-30T09:35:00+09:00",
    "expiresAt": "2026-07-30T13:35:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本市"
    ],
    "offline": false
  },
  {
    "id": "medical",
    "category": "medical",
    "icon": "薬",
    "title": "薬・医療を止めない",
    "summary": "診療可能な医療機関でも、診療科や受付が制限される場合があります。公式案内と代替連絡手段を確認します。",
    "steps": [
      "命の危険・重い症状は、すぐ119番に電話する",
      "公式の医療情報で診療状況を確認する",
      "受け入れ可否は、行く前に電話で確認する",
      "お薬手帳か、薬の名前がわかるものを持って行く"
    ],
    "keywords": [
      "くすり",
      "病院",
      "びょういん",
      "医者",
      "いしゃ",
      "医療",
      "診療",
      "しんりょう",
      "けが",
      "怪我",
      "処方",
      "しょほう",
      "お薬手帳",
      "持病",
      "じびょう",
      "透析",
      "歯",
      "熱",
      "痛い"
    ],
    "action": "熊本県の医療情報を確認する",
    "caution": "このアプリは診断や受入可否を判定しません。重い症状や命の危険がある場合は119番です。",
    "sourceName": "熊本県",
    "sourceUrl": "https://www.pref.kumamoto.jp/",
    "publishedAt": "2026-07-30T09:35:00+09:00",
    "fetchedAt": "2026-07-30T09:35:00+09:00",
    "checkedAt": "2026-07-30T09:35:00+09:00",
    "expiresAt": "2026-07-30T13:35:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本県全域"
    ],
    "offline": true
  },
  {
    "id": "communication",
    "category": "communication",
    "icon": "電",
    "title": "連絡できないときの順番",
    "summary": "携帯会社の障害、JAPANローミング™、00000JAPAN、公衆電話、災害用伝言171を順に確認します。",
    "steps": [
      "契約している携帯会社の障害情報を確認する",
      "つながらないときは00000JAPANや公衆電話を試す",
      "家族への連絡は災害用伝言ダイヤル171に録音する"
    ],
    "keywords": [
      "でんわ",
      "電話",
      "スマホ",
      "携帯",
      "けいたい",
      "充電",
      "じゅうでん",
      "電池",
      "バッテリー",
      "wifi",
      "ワイファイ",
      "171",
      "伝言",
      "でんごん",
      "安否",
      "あんぴ",
      "停電",
      "ていでん",
      "圏外",
      "つながらない",
      "家族"
    ],
    "action": "通信各社の公式障害情報を確認する",
    "caution": "00000JAPANは暗号化されていません。住所、医療情報、ID、パスワード、金融情報を送らないでください。",
    "sourceName": "電気通信事業者協会（TCA）・通信各社",
    "sourceUrl": "https://www.tca.or.jp/information/japan-roaming.html",
    "publishedAt": "2026-07-30T09:35:00+09:00",
    "fetchedAt": "2026-07-30T09:35:00+09:00",
    "checkedAt": "2026-07-30T09:35:00+09:00",
    "expiresAt": "2026-07-30T13:35:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本県全域"
    ],
    "offline": true
  },
  {
    "id": "roads",
    "category": "transport",
    "icon": "道",
    "title": "移動前に道路・交通を再確認する",
    "summary": "目的地が開いていても、道路規制や公共交通の運休で到達できない場合があります。",
    "steps": [
      "出発前に道路規制と公共交通の運行を確認する",
      "通行実績は「通れる保証」ではないと考える",
      "迂回や移動の中止も選択肢に入れる"
    ],
    "keywords": [
      "どうろ",
      "通行止め",
      "つうこうどめ",
      "渋滞",
      "じゅうたい",
      "電車",
      "バス",
      "交通",
      "こうつう",
      "迂回",
      "うかい",
      "移動",
      "いどう",
      "運休"
    ],
    "action": "国土交通省の道路情報を確認する",
    "caution": "通行実績は通行可能の保証ではありません。出発直前に道路管理者と現地の規制を優先してください。",
    "sourceName": "国土交通省 九州地方整備局",
    "sourceUrl": "https://www.qsr.mlit.go.jp/",
    "publishedAt": "2026-07-30T09:35:00+09:00",
    "fetchedAt": "2026-07-30T09:35:00+09:00",
    "checkedAt": "2026-07-30T09:35:00+09:00",
    "expiresAt": "2026-07-30T13:35:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本県全域"
    ],
    "offline": true
  },
  {
    "id": "evidence",
    "category": "recovery",
    "icon": "撮",
    "title": "片付け・修理の前に写真を残す",
    "summary": "建物の外側4方向、各部屋の全景、被災箇所の接写を撮り、申請に必要な証拠を残します。",
    "steps": [
      "片付けの前に、建物の外側4方向を撮影する",
      "各部屋の全景と、被災箇所の接写を撮影する",
      "写真は消さずに保管し、SNSへ載せない"
    ],
    "keywords": [
      "しゃしん",
      "写真",
      "撮影",
      "さつえい",
      "罹災",
      "り災",
      "りさい",
      "保険",
      "ほけん",
      "片付け",
      "かたづけ",
      "修理",
      "しゅうり",
      "証明",
      "被害",
      "家"
    ],
    "action": "熊本市のり災証明案内を確認する",
    "caution": "表札、顔、書類番号、位置情報が写る写真をSNSや非公式業者へ渡さないでください。",
    "sourceName": "熊本市",
    "sourceUrl": "https://www.city.kumamoto.jp/list04828.html",
    "publishedAt": "2026-07-30T09:35:00+09:00",
    "fetchedAt": "2026-07-30T09:35:00+09:00",
    "checkedAt": "2026-07-30T09:35:00+09:00",
    "expiresAt": "2026-07-30T13:35:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本市"
    ],
    "offline": true
  },
  {
    "id": "support-systems",
    "category": "recovery",
    "icon": "順",
    "title": "支援制度は手続きの順番を確認する",
    "summary": "写真、相談、見積、契約、支払いの順番を確認します。先に支払うと利用できない制度があります。",
    "steps": [
      "支払い・契約の前に、公式窓口へ相談する",
      "写真→相談→見積→契約の順番を守る",
      "期限と必要書類を公式ページで確認する"
    ],
    "keywords": [
      "しえん",
      "支援",
      "制度",
      "せいど",
      "お金",
      "おかね",
      "給付",
      "きゅうふ",
      "申請",
      "しんせい",
      "手続き",
      "てつづき",
      "業者",
      "ぎょうしゃ",
      "見積",
      "みつもり",
      "補助",
      "相談"
    ],
    "action": "熊本市の公式支援情報を確認する",
    "caution": "このアプリは受給可否を判定しません。期限と必要書類を公式窓口で最終確認してください。",
    "sourceName": "熊本市",
    "sourceUrl": "https://www.city.kumamoto.jp/list04828.html",
    "publishedAt": "2026-07-30T09:35:00+09:00",
    "fetchedAt": "2026-07-30T09:35:00+09:00",
    "checkedAt": "2026-07-30T09:35:00+09:00",
    "expiresAt": "2026-07-30T13:35:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本市"
    ],
    "offline": true
  }
];

export const siteCheckedAt = actionCards.reduce(
  (latest, card) => (card.checkedAt > latest ? card.checkedAt : latest),
  actionCards[0]?.checkedAt ?? "",
);

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string, now: Date) {
  const diffMinutes = Math.round((now.getTime() - new Date(value).getTime()) / 60000);
  if (diffMinutes < 1) return "たった今";
  if (diffMinutes < 60) return `約${diffMinutes}分前`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `約${hours}時間前`;
  return `約${Math.floor(hours / 24)}日前`;
}

export function isExpired(card: ActionCard, now = new Date()) {
  return now.getTime() >= new Date(card.expiresAt).getTime();
}
