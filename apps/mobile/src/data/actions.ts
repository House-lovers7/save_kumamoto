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
  /**
   * 出典ページで必ず区別して確認する項目。混同すると健康被害や無駄足につながる。
   * options には出典ページに実際に書かれている区分だけを入れる。区分を推測で作らない。
   */
  verifyPoints?: { label: string; options: string[]; why: string }[];
  /** 順序を誤ると取り返しがつかない手続き。出典ページに書かれている順序・期限だけを入れる。 */
  irreversibleOrder?: string[];
  /**
   * sourceStatus が "unavailable" のとき、リンク先で何が確認できていないかを書く。
   * 情報がないことを黙って隠さないための説明で、"unavailable" なら必須。
   */
  unverified?: string;
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
    "publishedAt": "2026-07-30T00:00:00+09:00",
    "fetchedAt": "2026-07-31T18:30:00+09:00",
    "checkedAt": "2026-07-31T18:30:00+09:00",
    "expiresAt": "2026-08-01T18:30:00+09:00",
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
    "publishedAt": "2026-07-31T00:00:00+09:00",
    "fetchedAt": "2026-07-31T18:30:00+09:00",
    "checkedAt": "2026-07-31T18:30:00+09:00",
    "expiresAt": "2026-08-01T18:30:00+09:00",
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
    "title": "水をもらう前に、飲める水かを確認する",
    "summary": "熊本市は井戸水を提供しています。同じ井戸水でも飲料用と生活用水があり、用途が分かれています。場所と利用できる時間も合わせて確認します。",
    "steps": [
      "公式ページで場所と利用できる時間を確認する",
      "飲料用か生活用水かを確認してから使う",
      "容器（ポリタンク・ペットボトル）は自分で用意する"
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
      "蛇口",
      "井戸",
      "いど"
    ],
    "action": "熊本市の井戸水提供の案内を開く",
    "caution": "「登録施設」と「現在使える施設」は別です。公式に利用可能と確認できない場所へ向かわないでください。",
    "verifyPoints": [
      {
        "label": "水の用途",
        "options": [
          "飲料用",
          "生活用水"
        ],
        "why": "飲料用として提供される井戸水は、一般細菌・大腸菌・硝酸態窒素など10項目の水質検査で一定の基準を満たしたものです。生活用水は飲むために提供されていません。"
      }
    ],
    "sourceName": "熊本市 水保全課",
    "sourceUrl": "https://www.city.kumamoto.jp/kiji00315906/index.html",
    "publishedAt": "2026-07-31T00:00:00+09:00",
    "fetchedAt": "2026-07-31T18:30:00+09:00",
    "checkedAt": "2026-07-31T18:30:00+09:00",
    "expiresAt": "2026-08-01T18:30:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本市"
    ],
    "offline": true
  },
  {
    "id": "food-and-supplies",
    "category": "essentials",
    "icon": "食",
    "title": "水・食料・生活用品の入手先を探す",
    "summary": "食料・生活用品の配布場所と時間をまとめた公式案内は、今回の巡回では見つかりませんでした。熊本市の集約ページから探すか、窓口へ電話で確認してください。",
    "steps": [
      "熊本市の集約ページで生活情報の項目を探す",
      "見つからないときは市町村の窓口へ電話で確認する",
      "店舗は公式サイト・公式SNSの営業情報を確認する"
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
    "action": "熊本市の災害情報から探す",
    "caution": "このアプリは在庫や到着時刻を保証しません。古い営業情報だけで移動・注文しないでください。",
    "sourceName": "熊本市",
    "sourceUrl": "https://www.city.kumamoto.jp/list04828.html",
    "publishedAt": "2026-07-31T00:00:00+09:00",
    "fetchedAt": "2026-07-31T18:30:00+09:00",
    "checkedAt": "2026-07-31T18:30:00+09:00",
    "expiresAt": "2026-08-01T18:30:00+09:00",
    "sourceStatus": "unavailable",
    "unverified": "食料・生活用品の配布場所と時間をまとめた公式案内は、2026年7月31日の巡回では確認できませんでした。リンク先は熊本市の災害情報の集約ページです。",
    "areas": [
      "熊本市"
    ],
    "offline": true
  },
  {
    "id": "fuel",
    "category": "essentials",
    "icon": "油",
    "title": "給油できる場所を探す",
    "summary": "給油できる場所や給油制限をまとめた公式案内は、今回の巡回では見つかりませんでした。県の災害情報を見たうえで、各事業者の公式情報を直接確認してください。",
    "steps": [
      "残量に余裕があるうちに給油の計画を立てる",
      "県の災害情報に燃料の案内が出ていないか確認する",
      "各事業者の公式サイト・公式SNSで営業を確認する"
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
    "sourceName": "熊本県 広報課",
    "sourceUrl": "https://www.pref.kumamoto.jp/soshiki/1/274517.html",
    "publishedAt": "2026-07-31T00:00:00+09:00",
    "fetchedAt": "2026-07-31T18:30:00+09:00",
    "checkedAt": "2026-07-31T18:30:00+09:00",
    "expiresAt": "2026-08-01T18:30:00+09:00",
    "sourceStatus": "unavailable",
    "unverified": "給油できる場所と給油制限の公式案内は、2026年7月31日の巡回では確認できませんでした。リンク先は熊本県の令和8年熊本地震に関する情報ページです。",
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
    "summary": "断水中は便器に水を流さず、携帯トイレなどで代用します。使用後の捨て方をまとめた公式案内は今回の巡回では見つからなかったため、市の窓口へ確認してください。",
    "steps": [
      "断水中は便器に水を流さない（逆流の危険）",
      "携帯トイレやごみ袋+吸水材で代用する",
      "使用後の捨て方は市の窓口へ電話で確認する"
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
    "action": "熊本市の災害ごみの案内を開く",
    "caution": "断水時に便器へ水を流すと逆流する場合があります。自治体の案内を優先してください。",
    "sourceName": "熊本市 廃棄物計画課",
    "sourceUrl": "https://www.city.kumamoto.jp/kiji00372079/index.html",
    "publishedAt": "2026-07-31T00:00:00+09:00",
    "fetchedAt": "2026-07-31T18:30:00+09:00",
    "checkedAt": "2026-07-31T18:30:00+09:00",
    "expiresAt": "2026-08-01T18:30:00+09:00",
    "sourceStatus": "unavailable",
    "unverified": "断水中のトイレ・携帯トイレ・し尿の処分方法の公式案内は、2026年7月31日の巡回では確認できませんでした。リンク先で確認できるのは災害ごみの出し方です。",
    "areas": [
      "熊本市"
    ],
    "offline": true
  },
  {
    "id": "infant-care",
    "category": "essentials",
    "icon": "子",
    "title": "乳幼児用品と預け先を探す",
    "summary": "ミルク・離乳食・おむつの配布先と授乳場所をまとめた公式案内は、今回の巡回では見つかりませんでした。保育施設の開園状況は公式に出ています。",
    "steps": [
      "保育施設の開園状況は公式ページで確認する",
      "ミルク・おむつの配布先は市町村の窓口に確認する",
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
    "action": "熊本市の保育施設の開園状況を開く",
    "caution": "乳幼児の体調をこのアプリで判断しません。心配な症状は医療機関や公的相談先へ確認してください。",
    "sourceName": "熊本市 保育幼稚園課",
    "sourceUrl": "https://www.city.kumamoto.jp/kiji00372099/index.html",
    "publishedAt": "2026-07-29T00:00:00+09:00",
    "fetchedAt": "2026-07-31T18:30:00+09:00",
    "checkedAt": "2026-07-31T18:30:00+09:00",
    "expiresAt": "2026-08-01T18:30:00+09:00",
    "sourceStatus": "unavailable",
    "unverified": "ミルク・離乳食・おむつの配布先と授乳・休憩場所の公式案内は、2026年7月31日の巡回では確認できませんでした。リンク先で確認できるのは保育施設の開園状況です。",
    "areas": [
      "熊本市"
    ],
    "offline": true
  },
  {
    "id": "elder-care",
    "category": "essentials",
    "icon": "介",
    "title": "高齢者・介護の支援継続先を確認する",
    "summary": "被保険者証を失くしても、氏名・住所・生年月日・負担割合を伝えれば介護保険サービスを受けられます。要介護認定の申請も証書なしでできます。",
    "steps": [
      "利用中の事業所に休止・代替の予定を確認する",
      "被保険者証がなくても利用できることを確認する",
      "つながらないときは市町村の相談窓口へ連絡する"
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
    "action": "熊本県の介護保険の特例案内を開く",
    "caution": "氏名、病名、服薬、居場所を公開画面やSNSへ投稿しないでください。",
    "verifyPoints": [
      {
        "label": "被保険者証がないときに伝えること",
        "options": [
          "氏名",
          "住所",
          "生年月日",
          "負担割合"
        ],
        "why": "被保険者証や負担割合証を紛失した方、自宅に残したまま避難した方も、この4つを伝えることでサービスを受けられます。証書がないことを理由にあきらめないでください。"
      }
    ],
    "sourceName": "熊本県 認知症施策・地域ケア推進課",
    "sourceUrl": "https://www.pref.kumamoto.jp/soshiki/33/274616.html",
    "publishedAt": "2026-07-29T00:00:00+09:00",
    "fetchedAt": "2026-07-31T18:30:00+09:00",
    "checkedAt": "2026-07-31T18:30:00+09:00",
    "expiresAt": "2026-08-01T18:30:00+09:00",
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
    "publishedAt": "2026-07-28T16:49:00+09:00",
    "fetchedAt": "2026-07-31T18:30:00+09:00",
    "checkedAt": "2026-07-31T18:30:00+09:00",
    "expiresAt": "2026-08-01T18:30:00+09:00",
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
    "sourceName": "熊本県 国保・高齢者医療課",
    "sourceUrl": "https://www.pref.kumamoto.jp/soshiki/43/274584.html",
    "publishedAt": "2026-07-29T00:00:00+09:00",
    "fetchedAt": "2026-07-31T18:30:00+09:00",
    "checkedAt": "2026-07-31T18:30:00+09:00",
    "expiresAt": "2026-08-01T18:30:00+09:00",
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
    "publishedAt": "2026-04-01T00:00:00+09:00",
    "fetchedAt": "2026-07-31T18:30:00+09:00",
    "checkedAt": "2026-07-31T18:30:00+09:00",
    "expiresAt": "2026-08-01T18:30:00+09:00",
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
    "publishedAt": "2026-07-28T00:00:00+09:00",
    "fetchedAt": "2026-07-31T18:30:00+09:00",
    "checkedAt": "2026-07-31T18:30:00+09:00",
    "expiresAt": "2026-08-01T18:30:00+09:00",
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
    "irreversibleOrder": [
      "片付けや修理の前に、家屋の被害状況を写真に撮る",
      "被災届出証明書は原則、被災後1か月以内に申請する"
    ],
    "sourceName": "熊本市 各区役所福祉課",
    "sourceUrl": "https://www.city.kumamoto.jp/kiji0032451/index.html",
    "publishedAt": "2026-07-30T00:00:00+09:00",
    "fetchedAt": "2026-07-31T18:30:00+09:00",
    "checkedAt": "2026-07-31T18:30:00+09:00",
    "expiresAt": "2026-08-01T18:30:00+09:00",
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
    "irreversibleOrder": [
      "支払いや契約の前に、公式窓口へ相談する",
      "住家の緊急の修理は災害発生の日から10日以内に完了する"
    ],
    "sourceName": "熊本市",
    "sourceUrl": "https://www.city.kumamoto.jp/list04828.html",
    "publishedAt": "2026-07-30T00:00:00+09:00",
    "fetchedAt": "2026-07-31T18:30:00+09:00",
    "checkedAt": "2026-07-31T18:30:00+09:00",
    "expiresAt": "2026-08-01T18:30:00+09:00",
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
