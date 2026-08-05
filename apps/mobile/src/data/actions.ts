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
  /**
   * 出典ページに実際に書かれている核心情報を、カード内で読める形にしたもの。
   *
   * 利用者に公式サイトの構造を探索させないための「答え」。リンクは出典明示と最新確認の
   * ためであって、情報を探させるためではない（2026-08-01 ユーザー要望）。
   * 入れてよいのは出典に書かれている記載だけで、住所・時間・電話番号を推測で作らない。
   * 日付に依存するグループは、毎日の巡回で当日分へ照合・更新する。
   */
  facts?: {
    /** 何の答えかが一目で分かる見出し。例:「8月1日（土曜日）の応急給水所 12か所」 */
    label: string;
    /** 1行1項目。出典の文言を短く写す。例:「南区 隈庄小学校（南区城南町隈庄270）」 */
    items: string[];
    /** 出典のどこに書かれているか（実在の見出し文言）。巡回のたびに照合する。 */
    citedAs: string;
    /**
     * その日限りの内容（今日の給水所・今日の配布時間）。期限切れになったら表示しない。
     * 翌日も出し続けることは、終了した場所・閉まっている時間へ人を向かわせることと同じ。
     *
     * 逆に、電話番号や制度の期限のように日付へ依存しない答えは `dated` を付けない。
     * 情報が古くなったときほど「どこへ聞けばよいか」が必要になるため、期限切れでも残す。
     */
    dated?: boolean;
  }[];
  sourceName: string;
  sourceUrl: string;
  /**
   * リンク先の最初の画面で、カードが約束した情報がどこにあるかの目印。
   *
   * 深いURLが存在しない出典（1ページに全告知が縦積みされる氷川町の緊急情報、
   * JSONを描画する上下水道局のトップなど）で、探す先を名指しするために使う。
   * 出典の実物から引用した見出し文言だけを入れ、巡回のたびに文言を照合する。
   */
  sourceLandmark?: string;
  publishedAt: string;
  fetchedAt: string;
  checkedAt: string;
  expiresAt: string;
  sourceStatus: SourceStatus;
  /**
   * 出典の告知に書かれている、その日の受付時間帯。
   *
   * expiresAt とは別の軸。expiresAt は「この情報をいつまで信じてよいか」で、こちらは
   * 「行けば受け取れる時間はいつか」。両方を持たないと、期限内なのに現地は閉まっている
   * 時間帯（氷川町の配布なら 11:00〜15:00）に人を向かわせる。着いたら終わっていた、は
   * 被災者にとって心理的にも体力的にも最も損失が大きい失敗なので、分けて持つ。
   *
   * 入れてよいのは出典の告知に実際に書かれている時刻だけで、推測で作らない。
   * 「毎日8時から開くはず」のような日付非依存の一般化もしない（告知は当日限り）。
   *
   * 最後の枠の end は expiresAt と一致させる（当日限りカードの失効＝最終受付の終了）。
   * tests/data-contract.test.mjs がこれを固定しているので、毎日の巡回で当日分へ
   * 更新するときに片方だけ直すと npm test が落ちる。
   */
  availableWindows?: { label: string; start: string; end: string }[];
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

/**
 * 対象市町村。**並び順はおおよそ北から南**にしてある。
 *
 * 地域から選ぶ図（`area-map`）はこの順でタイルを並べるので、配列順がそのまま画面の
 * 上下になる。実際の位置関係に寄せてあるほうが自分の地域を探しやすい。
 *
 * ただし寄せているのは順番だけで、緯度経度も外形も持たない。図は模式配置であり、
 * 画面には「位置関係は実際の地理と異なります」を出す（寄せた分だけこの注記は重要になる）。
 * 並べ替えるときは、推測ではなく実際の南北関係だけを根拠にすること。
 */

export const municipalities = [
  "熊本県全域",
  "熊本市",
  "宇土市",
  "宇城市",
  "氷川町",
  "八代市",
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
    "summary": "県の災害情報、被害状況、支援情報を確認します。古い情報の場合があるため、更新日時も見てください。",
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
    "caution": "この案内は県や市が公式に提供するものではありません。",
    "sourceName": "熊本県 防災推進課",
    "sourceUrl": "https://www.pref.kumamoto.jp/soshiki/222/",
    "publishedAt": "2026-08-01T00:00:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
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
    "publishedAt": "2026-08-01T00:00:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本市"
    ],
    "offline": false
  },
  {
    "id": "water-station",
    "category": "water",
    "icon": "給",
    "title": "熊本市の臨時給水栓で水を受け取る",
    "summary": "熊本市上下水道局の応急給水活動は、断水及び濁水の解消に伴い、8月5日（水）19:00をもって終了しました。今後は南区の火の君文化センターに設置された臨時給水栓（蛇口）を利用します。時間は8:00〜19:00です。",
    "steps": [
      "最新の告知で臨時給水栓の場所と時間を確認する",
      "給水用の容器を各自持参する",
      "終了した応急給水所（学校など）には向かわない"
    ],
    "keywords": [
      "みず",
      "水",
      "給水",
      "きゅうすい",
      "給水所",
      "給水車",
      "断水",
      "だんすい",
      "水道",
      "すいどう",
      "ポリタンク",
      "応急",
      "くみに行く",
      "飲み水"
    ],
    "action": "上下水道局の第37報を開く",
    "caution": "この案内は給水を保証しません。応急給水活動は終了しており、臨時給水栓の運用も変わることがあります。出発前に最新の告知を確認してください。",
    "verifyPoints": [
      {
        "label": "終了した活動と、いま使える設備",
        "options": [
          "応急給水活動：8月5日（水）19:00をもって終了",
          "臨時給水栓（蛇口）：火の君文化センター（南区）で利用できる"
        ],
        "why": "第37報では、応急給水活動は断水及び濁水の解消に伴い令和8年8月5日（水）19:00をもちまして終了と告知されています。今後の給水は火の君文化センター（南区城南町舞原394-1）の臨時給水栓を8:00〜19:00に利用し、給水用の容器を各自持参します。以前の応急給水所（学校など）へ向かっても給水はありません。"
      }
    ],
    "facts": [
      {
        "label": "臨時給水栓（蛇口）",
        "items": [
          "火の君文化センター（南区城南町舞原394-1）",
          "時間：8:00〜19:00",
          "給水用の容器を各自ご持参"
        ],
        "citedAs": "【第37報】応急給水活動終了のお知らせ",
        "dated": true
      },
      {
        "label": "応急給水活動の終了",
        "items": [
          "応急給水活動は、断水及び濁水の解消に伴い、令和8年8月5日（水）19:00をもちまして終了"
        ],
        "citedAs": "【第37報】応急給水活動終了のお知らせ"
      }
    ],
    "sourceName": "熊本市上下水道局",
    "sourceUrl": "https://www.kumamoto-waterworks.jp/waterworks_emergency/42551/",
    "sourceLandmark": "【第37報】応急給水活動終了のお知らせ",
    "publishedAt": "2026-08-05T17:35:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-06T19:00:00+09:00",
    "sourceStatus": "official",
    "availableWindows": [
      {
        "label": "臨時給水栓",
        "start": "2026-08-06T08:00:00+09:00",
        "end": "2026-08-06T19:00:00+09:00"
      }
    ],
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
    "caution": "「登録施設」と「現在使える施設」は別です。公式に利用可能と確認できない場所へ向かわないでください。井戸を管理する企業へ直接電話しないでください。",
    "verifyPoints": [
      {
        "label": "水の用途",
        "options": [
          "飲料用",
          "生活用水"
        ],
        "why": "飲料用として提供される井戸水は、一般細菌・大腸菌・硝酸態窒素など10項目の水質検査で一定の基準を満たしたものです。生活用水は飲むために提供されていません。「飲料用」の井戸も、災害発生後に熊本市が行う水質検査の結果によっては飲めなくなることがあると出典に書かれています。"
      }
    ],
    "facts": [
      {
        "label": "災害用井戸の問い合わせ先",
        "items": [
          "水保全課 096-328-2436"
        ],
        "citedAs": "災害用井戸利用可能状況"
      }
    ],
    "sourceName": "熊本市 水保全課",
    "sourceUrl": "https://www.city.kumamoto.jp/kiji00315906/index.html",
    "sourceLandmark": "◆井戸リスト",
    "publishedAt": "2026-07-31T18:00:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本市"
    ],
    "offline": true
  },
  {
    "id": "water-hikawa",
    "category": "water",
    "icon": "給",
    "title": "氷川町で給水車から水を受け取る",
    "summary": "氷川町は給水車による応急給水を行っています。時間は7時から19時まで、場所は氷川町役場と宮原振興局で、1回あたり5リットルまでと告知されています。",
    "steps": [
      "氷川町の緊急情報で給水車の案内を確認する",
      "水を入れる容器を持って氷川町役場か宮原振興局へ行く",
      "1回あたり5リットルまでの案内に従う"
    ],
    "keywords": [
      "みず",
      "水",
      "給水",
      "きゅうすい",
      "給水車",
      "断水",
      "だんすい",
      "水道",
      "すいどう",
      "ポリタンク",
      "氷川",
      "ひかわ",
      "役場",
      "やくば",
      "宮原",
      "みやはら"
    ],
    "action": "氷川町の緊急情報を開く",
    "caution": "この案内は給水を保証しません。告知は随時更新されるため、出発前に氷川町の緊急情報で最新の掲載を確認してください。",
    "facts": [
      {
        "label": "給水車による応急給水",
        "items": [
          "時間：7：00〜19：00",
          "場所：氷川町役場、宮原振興局",
          "※1回あたり5ℓまで"
        ],
        "citedAs": "給水車による応急給水について"
      }
    ],
    "sourceName": "氷川町 総務課",
    "sourceUrl": "https://www.town.hikawa.kumamoto.jp/kinkyu.html",
    "sourceLandmark": "給水車による応急給水について",
    "publishedAt": "2026-08-01T15:36:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "氷川町"
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
      "熊本市の集約ページで新着のお知らせを確認する",
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
    "caution": "この案内は在庫や到着時刻を保証しません。古い営業情報だけで移動・注文しないでください。",
    "facts": [
      {
        "label": "熊本市の問い合わせ先",
        "items": [
          "熊本市コールセンター（ひごまるコール） 096-334-1500",
          "年中無休 8時から20時"
        ],
        "citedAs": "市の手続きやイベントなどのお問い合せ"
      }
    ],
    "sourceName": "熊本市",
    "sourceUrl": "https://www.city.kumamoto.jp/list04828.html",
    "publishedAt": "2026-08-01T00:00:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
    "sourceStatus": "unavailable",
    "unverified": "食料・生活用品の配布場所と時間をまとめた公式案内は、2026年8月1日の巡回でも確認できませんでした。熊本市の支援制度の冊子にある「被服、寝具その他生活必需品の支給」は申請受付がまだ準備中で、食料の配布についての項目はありません。",
    "areas": [
      "熊本市"
    ],
    "offline": true
  },
  {
    "id": "food-hikawa",
    "category": "essentials",
    "icon": "配",
    "title": "氷川町で水・食料を受け取る",
    "summary": "氷川町は8月1日まで、開設中の避難所と同じ3か所で水・食料品を配布していました。受け取る側への配布の告知は、現在の緊急情報には掲載がありません。",
    "steps": [
      "氷川町の緊急情報で配布の告知が出ていないかを確認する",
      "前日分の告知と混同しない（日付ごとに出し直される）",
      "受け取り方や量は現地の案内に従う"
    ],
    "keywords": [
      "ごはん",
      "ご飯",
      "食べ物",
      "たべもの",
      "食料",
      "しょくりょう",
      "配布",
      "はいふ",
      "配給",
      "はいきゅう",
      "物資",
      "水",
      "みず",
      "氷川",
      "ひかわ",
      "竜北",
      "りゅうほく"
    ],
    "action": "氷川町の緊急情報を開く",
    "caution": "この案内は配布を保証しません。中止や時間の変更があるため、出発前に氷川町の緊急情報で当日の掲載を確認してください。",
    "sourceName": "氷川町 総務課",
    "sourceUrl": "https://www.town.hikawa.kumamoto.jp/kinkyu.html",
    "publishedAt": "2026-08-01T00:00:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
    "sourceStatus": "unavailable",
    "unverified": "氷川町が受け取る側へ向けて出していた「8月1日（土曜日）の水・食料品の配布について」は、2026年8月4日21時の巡回では確認できませんでした。現在載っているのは提供する側への「支援物資のご協力をお願いします」で、配布の場所と時間は確認できていません。同じページの給水車による応急給水は続いています。",
    "areas": [
      "氷川町"
    ],
    "offline": false
  },
  {
    "id": "fuel",
    "category": "essentials",
    "icon": "油",
    "title": "給油できる場所を探す",
    "summary": "資源エネルギー庁の地図で、近くの給油所が営業できているかを確認します。表示は各給油所が報告した時点のもので、着くまでに変わることがあります。",
    "steps": [
      "残量に余裕があるうちに給油の計画を立てる",
      "地図で近くの給油所の営業状況を確認する",
      "報告時点の情報なので、着く前に変わると考える"
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
    "action": "住民拠点SS等検索で営業状況を開く",
    "caution": "営業中・在庫ありとは断定しません。補給時刻や在庫量をSNSへ転載しないでください。",
    "verifyPoints": [
      {
        "label": "給油所の営業状況の区分",
        "options": [
          "営業可",
          "営業不可",
          "確認中"
        ],
        "why": "「確認中」は営業しているという意味ではありません。表示は各給油所が報告した時点のもので、在庫不足による営業停止が発生するなど、実際の状況と違うことがあると出典に明記されています。"
      }
    ],
    "sourceName": "資源エネルギー庁 資源・燃料部",
    "sourceUrl": "https://www.enecho-ss.meti.go.jp/b/enecho/",
    "publishedAt": "2026-07-28T16:31:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
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
    "facts": [
      {
        "label": "災害廃棄物の問い合わせ先",
        "items": [
          "廃棄物計画課 096-328-2359",
          "中央区役所総務企画課 096-328-2610",
          "東区役所総務企画課 096-367-9121",
          "西区役所総務企画課 096-329-1142",
          "南区役所総務企画課 096-357-4112",
          "北区役所総務企画課 096-272-1112"
        ],
        "citedAs": "災害廃棄物に関する問合せは下記にお願いします"
      }
    ],
    "sourceName": "熊本市 廃棄物計画課",
    "sourceUrl": "https://www.city.kumamoto.jp/kiji00372079/index.html",
    "publishedAt": "2026-07-31T00:00:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
    "sourceStatus": "unavailable",
    "unverified": "断水中のトイレ・携帯トイレ・し尿の処分方法の公式案内は、2026年8月1日の巡回でも確認できませんでした。熊本市上下水道局の緊急情報20件にも記載がありません。リンク先で確認できるのは災害ごみの出し方です。",
    "areas": [
      "熊本市"
    ],
    "offline": true
  },
  {
    "id": "toilet-container",
    "category": "essentials",
    "icon": "簡",
    "title": "派遣されたコンテナ型トイレの場所を知る",
    "summary": "国土交通省が、防災用コンテナ型トイレを美里町・宇城市・氷川町・八代市へ派遣したと発表しています。到着予定は7月30日から31日で、いま設置が続いているかはこの発表では分かりません。",
    "steps": [
      "発表された設置場所を確認する",
      "行く前に、その市町へ設置が続いているか電話で確認する",
      "使えないときは避難所の運営者に相談する"
    ],
    "keywords": [
      "といれ",
      "トイレ",
      "仮設トイレ",
      "かせつ",
      "コンテナ",
      "便所",
      "べんじょ",
      "用を足す",
      "汚水",
      "宇城",
      "うき",
      "八代",
      "やつしろ",
      "氷川",
      "ひかわ",
      "美里",
      "みさと"
    ],
    "action": "国土交通省の派遣の発表（PDF）を開く",
    "caution": "7月30日時点の派遣の発表です。撤収や移設の情報は出典にありません。出典自身が「設置場所は、現地状況等によって変更の可能性があります」と書いています。",
    "verifyPoints": [
      {
        "label": "発表された設置場所",
        "options": [
          "美里町（美里町カントリーパーク）",
          "宇城市（小川町総合文化センター）",
          "氷川町（氷川町伝承館）",
          "八代市（八代市鏡支所）"
        ],
        "why": "これは7月30日から31日にかけて到着予定と発表された場所です。各市町の公式サイトには2026年8月1日の巡回時点で掲載がなく、いま稼働しているかは確認できていません。空振りを避けるため、向かう前に市町へ確認してください。"
      }
    ],
    "sourceName": "国土交通省 九州地方整備局",
    "sourceUrl": "https://www.qsr.mlit.go.jp/content/000002570.pdf",
    "publishedAt": "2026-07-30T00:00:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "宇城市",
      "八代市",
      "氷川町",
      "その他の市町村"
    ],
    "offline": true
  },
  {
    "id": "infant-care",
    "category": "essentials",
    "icon": "子",
    "title": "乳幼児用品と預け先を探す",
    "summary": "ミルク・離乳食・おむつの配布先と授乳場所をまとめた公式案内は、今回の巡回では見つかりませんでした。保育施設は、通っている園へ直接確認するよう案内されています。",
    "steps": [
      "通っている園へ直接、開園と受け入れを確認する",
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
    "caution": "この案内では乳幼児の体調を判断できません。心配な症状は医療機関や公的相談先へ確認してください。",
    "facts": [
      {
        "label": "熊本市の問い合わせ先",
        "items": [
          "熊本市コールセンター（ひごまるコール） 096-334-1500",
          "年中無休 8時から20時"
        ],
        "citedAs": "市の手続きやイベントなどのお問い合せ"
      }
    ],
    "sourceName": "熊本市 保育幼稚園課",
    "sourceUrl": "https://www.city.kumamoto.jp/kiji00372099/index.html",
    "publishedAt": "2026-07-29T00:00:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
    "sourceStatus": "unavailable",
    "unverified": "ミルク・離乳食・おむつの配布先と授乳・休憩場所の公式案内は、2026年8月1日の巡回でも確認できませんでした。リンク先の保育施設の開園状況は7月30日分までで、その先は通っている園へ直接確認するよう案内されています。",
    "areas": [
      "熊本市"
    ],
    "offline": true
  },
  {
    "id": "bath-kumamoto",
    "category": "essentials",
    "icon": "湯",
    "title": "無料で入浴できる場所を探す",
    "summary": "熊本市は2026年8月1日から、避難生活や自宅の被災で入浴できない方を対象に、無料入浴サービスを実施しています。実施施設は25か所で、所在地・営業時間・店休日が出典に掲載されています。",
    "steps": [
      "自分が対象になるかを確認する",
      "施設の所在地・営業時間・店休日を確認する",
      "住所・氏名が確認できるものを持って行く"
    ],
    "keywords": [
      "ふろ",
      "風呂",
      "お風呂",
      "おふろ",
      "入浴",
      "にゅうよく",
      "シャワー",
      "しゃわー",
      "銭湯",
      "温泉",
      "おんせん",
      "体を洗う",
      "汗",
      "あせ"
    ],
    "action": "熊本市の無料入浴サービスの案内を開く",
    "caution": "営業時間などが変更になることがあるため、利用前に最新情報を確認してください。施設は随時追加されると出典に書かれています。",
    "verifyPoints": [
      {
        "label": "対象となる方",
        "options": [
          "避難所や車中泊などの避難生活を送っている方",
          "自宅の浴室や給湯設備などが被災し、入浴ができない方"
        ],
        "why": "このいずれかに該当する方が対象です。市外にお住まいの方でも該当すれば利用できると出典に書かれています。受付で住所・氏名・年齢などを記入し、運転免許証やマイナンバーカードなど住所・氏名を確認できるものが必要です。"
      }
    ],
    "facts": [
      {
        "label": "無料入浴の実施施設 中央区5か所",
        "items": [
          "大福湯 13:00〜23:00（中央区坪井2丁目5-28）休：火曜",
          "龍の湯 15:00〜22:00（中央区琴平本町5-54）休：毎月1・5・11・15・21・25日",
          "世安湯 17:00〜21:00（中央区世安2丁目2-26）休：火、水曜",
          "神水公衆浴場 16:00〜20:00（中央区神水2丁目2-18）休：火、木、金曜",
          "湯らっくす 10:00〜翌8:00（中央区本荘町722）休：なし"
        ],
        "citedAs": "3 実施施設"
      },
      {
        "label": "無料入浴の実施施設 東区4か所",
        "items": [
          "たかの湯 14:00〜22:00（東区栄町1-46）休：月曜",
          "つる乃湯熊本インター店 6:00〜22:50（東区石原2丁目4-11）休：なし",
          "ピースフル優祐悠 6:00〜24:00（東区下南部3丁目11-136）休：なし",
          "ばってんの湯 10:00〜翌2:00（東区江津3丁目5-17）休：なし"
        ],
        "citedAs": "3 実施施設"
      },
      {
        "label": "無料入浴の実施施設 西区1か所・南区2か所",
        "items": [
          "かもと湯 13:00〜20:00（西区河内町船津2712-1）休：火、日曜",
          "富合サウナランド 8:00〜22:00（南区富合町田尻45-1）休：なし",
          "しあわせの湯 11:00〜20:00（南区富合町田尻611）休：日、月曜"
        ],
        "citedAs": "3 実施施設"
      },
      {
        "label": "無料入浴の実施施設 北区13か所",
        "items": [
          "梶尾温泉 10:00〜21:00（北区梶尾町1294-2）休：月曜",
          "松の湯 9:00〜21:00（北区植木町田底311）休：なし",
          "あしはらの湯 9:00〜22:00（北区植木町田底2031-1）休：第3水曜",
          "宝の湯 5:00〜22:00（北区植木町平井1641）休：なし",
          "植木温泉 湯の森ホテル （〜8月7日）15:00〜24:00（北区植木町田底6）休：なし",
          "植木温泉 湯の森ホテル （8月8日〜）10:00〜24:00",
          "旅館 大月苑 11:00〜16:00（北区植木町米塚173）休：8月4、5、12、18、25日",
          "旅館 鷹の家 10:00〜15:00、18:00〜21:00（北区植木町米塚26-2）休：水曜",
          "旅館 いろは 10:00〜21:00（北区植木町田底30）休：火曜",
          "旅館 平山 10:00〜16:00、18:00〜21:00（北区植木町米塚178）休：8月3、17、24日",
          "ふろや湯湧 12:00〜22:00（北区植木町米塚22-1）休：8月10、25日",
          "植木温泉 ほてい湯 14:00〜22:00（北区植木町正清344-1）休：水曜",
          "旅館 松乃湯 10:00〜12:00、15:00〜21:00（北区植木町米塚208）",
          "旅館 松乃湯 休：8月3、6、15、16、17、24、27、31日",
          "旅館 桐乃湯 10:00〜18:00（北区植木町米塚394-2）休：不定休"
        ],
        "citedAs": "3 実施施設"
      }
    ],
    "sourceName": "熊本市",
    "sourceUrl": "https://www.city.kumamoto.jp/kiji00372200/index.html",
    "publishedAt": "2026-08-05T00:00:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本市"
    ],
    "offline": false
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
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
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
    "summary": "熊本市の公式サイトから開設中の避難所を確認します。ペットの同行など受け入れの条件は避難所ごとに違うため、行く前に確認します。",
    "steps": [
      "公式ページで開設中の避難所を確認する",
      "ペットや車中泊の可否は行く前に電話で確認する",
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
    "sourceLandmark": "避難所情報",
    "publishedAt": "2026-07-28T16:49:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "熊本市"
    ],
    "offline": false
  },
  {
    "id": "shelter-hikawa",
    "category": "shelter",
    "icon": "所",
    "title": "氷川町の開設中の避難所を確認する",
    "summary": "氷川町が開設している避難所は、緊急情報のページに一覧で出ています。開設場所は変わることがあるため、行く前に最新の掲載を確認します。",
    "steps": [
      "氷川町の緊急情報で開設中の避難所を確認する",
      "受け入れの状況は行く前に町へ電話で確認する",
      "移動が難しいときは町へ相談する"
    ],
    "keywords": [
      "ひなん",
      "避難",
      "避難所",
      "ひなんじょ",
      "泊まる",
      "とまる",
      "寝る",
      "ねる",
      "居場所",
      "氷川",
      "ひかわ",
      "竜北",
      "りゅうほく"
    ],
    "action": "氷川町の緊急情報を開く",
    "caution": "混雑や設備は変化します。ペットや車中泊の可否はこのページには書かれていません。個人の避難先や避難者名をSNSへ投稿しないでください。",
    "facts": [
      {
        "label": "開設中の避難所 3か所",
        "items": [
          "竜北西部小学校",
          "竜北東小学校",
          "氷川中学校"
        ],
        "citedAs": "【開設中の避難所について】"
      }
    ],
    "sourceName": "氷川町 総務課",
    "sourceUrl": "https://www.town.hikawa.kumamoto.jp/kinkyu.html",
    "sourceLandmark": "【開設中の避難所について】",
    "publishedAt": "2026-07-31T10:56:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
    "sourceStatus": "official",
    "areas": [
      "氷川町"
    ],
    "offline": false
  },
  {
    "id": "medical",
    "category": "medical",
    "icon": "薬",
    "title": "薬・医療を止めない",
    "summary": "マイナ保険証や資格確認書がなくても医療機関を受診できます。診療科や受付が制限される場合があるため、行く前に電話で確認します。",
    "steps": [
      "命の危険・重い症状は、すぐ119番に電話する",
      "保険証がなくても受診できることを確認する",
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
    "action": "熊本県の受診についての案内を開く",
    "caution": "この案内は診断や受入可否を判定しません。重い症状や命の危険がある場合は119番です。",
    "sourceName": "熊本県 国保・高齢者医療課",
    "sourceUrl": "https://www.pref.kumamoto.jp/soshiki/43/274584.html",
    "publishedAt": "2026-07-29T00:00:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
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
    "summary": "電話がつながりにくいときの連絡手段を確認します。災害用伝言ダイヤル171、携帯各社の災害用伝言板、JAPANローミング™の案内が出ています。",
    "steps": [
      "家族への連絡は災害用伝言ダイヤル171に録音する",
      "つながらないときは各社の災害用伝言板を使う",
      "自分の携帯がJAPANローミングの対象かを確認する"
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
    "action": "災害時の連絡手段の案内を開く",
    "caution": "公衆Wi-Fiは暗号化されていないことがあります。住所、医療情報、ID、パスワード、金融情報を送らないでください。",
    "sourceName": "電気通信事業者協会（TCA）",
    "sourceUrl": "https://www.tca.or.jp/information/japan-roaming.html",
    "publishedAt": "2026-04-01T00:00:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
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
    "summary": "国土交通省九州地方整備局の地震対応ページで、通行止めと迂回路の発表、復旧の状況を確認します。公共交通の運行状況はこのページでは分かりません。",
    "steps": [
      "出発前に通行止めと迂回路の発表を確認する",
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
    "action": "九州地方整備局の地震対応ページを開く",
    "caution": "通行実績は通行可能の保証ではありません。出発直前に道路管理者と現地の規制を優先してください。",
    "sourceName": "国土交通省 九州地方整備局",
    "sourceUrl": "https://www.qsr.mlit.go.jp/bousai_joho/r80728kumamotozisinn.html",
    "publishedAt": "2026-07-31T16:00:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
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
    "summary": "片付けや修理を始める前に、家の外と中を撮ります。部屋ごとの全景と被災箇所の「寄り」が、り災証明の申請で使われます。",
    "steps": [
      "片付けや修理の前に、家の外と中を撮影する",
      "部屋ごとの全景と、被災箇所の「寄り」を撮影する",
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
    "facts": [
      {
        "label": "り災証明書の申請受付と受付時間",
        "items": [
          "電子申請（マイナポータル申請）：すでに受付開始しております",
          "窓口申請：令和8年（2026年）7月30日（木）午前9時から受付開始",
          "午前9時〜午後4時 月曜〜金曜（祝日除く）"
        ],
        "citedAs": "申請窓口の受付時間"
      },
      {
        "label": "り災証明書の申請窓口（各区福祉課・総合出張所）",
        "items": [
          "中央区福祉課 096-328-2312",
          "東区福祉課 096-367-9127",
          "西区福祉課 096-329-5403",
          "南区福祉課 096-357-4129",
          "北区福祉課 096-272-1118",
          "託麻総合出張所 096-380-3111",
          "河内総合出張所 096-276-1111",
          "天明総合出張所 096-223-1111",
          "幸田総合出張所 096-378-0172",
          "城南総合出張所 0964-28-3111",
          "清水総合出張所 096-343-9161",
          "龍田総合出張所 096-338-2231",
          "お住まいの区以外でも申請いただけます"
        ],
        "citedAs": "申請窓口"
      }
    ],
    "sourceName": "熊本市 各区役所福祉課",
    "sourceUrl": "https://www.city.kumamoto.jp/kiji0032451/index.html",
    "publishedAt": "2026-08-02T00:00:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
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
    "action": "熊本市の「住家の緊急の修理」の案内を開く",
    "caution": "この案内は受給可否を判定しません。期限と必要書類を公式窓口で最終確認してください。",
    "irreversibleOrder": [
      "支払いや契約の前に、公式窓口へ相談する",
      "住家の緊急の修理は、令和8年8月7日までに完了する"
    ],
    "facts": [
      {
        "label": "住家の緊急の修理の期限と上限",
        "items": [
          "令和8年（2026年）8月7日までに完了",
          "上限56,400円までを熊本市から修理業者へ支払う",
          "上限56,400円を超える場合、差額については申込者の負担が生じます"
        ],
        "citedAs": "【完了期限】"
      },
      {
        "label": "住家の緊急の修理の相談窓口",
        "items": [
          "住宅政策課 096-328-2449（受付 原則9〜16時）",
          "可能な限りメールにて相談・申込お願い致します"
        ],
        "citedAs": "【対応窓口】"
      }
    ],
    "sourceName": "熊本市 住宅政策課",
    "sourceUrl": "https://www.city.kumamoto.jp/kiji00372143/index.html",
    "publishedAt": "2026-08-04T00:00:00+09:00",
    "fetchedAt": "2026-08-06T01:44:00+09:00",
    "checkedAt": "2026-08-06T01:44:00+09:00",
    "expiresAt": "2026-08-07T01:44:00+09:00",
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

/**
 * 答えを畳んだ状態のままそのまま並べる上限。これを超える一覧はカード内の開閉に入れる。
 *
 * 答え自体はカードを畳んだままでも読める位置に出す（2026-08-01 ユーザー確定）。
 * ただし給水所12か所のような長い一覧を全カード分そのまま並べると、一覧表示の
 * スクロールが再び長くなる。開閉のラベルに件数と内訳を書いて、閉じたままでも
 * 中身が分かるようにしたうえで、アプリ内1タップで届く形にする。
 */
export const FACT_INLINE_LIMIT = 4;

export function isLongFact(fact: { items: string[] }) {
  return fact.items.length > FACT_INLINE_LIMIT;
}

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

/**
 * その時点でカードに出してよい答え。Web とネイティブが同じ規則を使うためにここへ置く。
 *
 * その日限りの答え（`dated`）は期限切れになったら出さない。翌日も出し続けることは、
 * 終了した給水所・閉まっている配布時間へ人を向かわせることと同じ。
 * 日付に依存しない答え（問い合わせ先など）は、期限切れでも残す。
 * 情報が古くなったときほど「どこへ聞けばよいか」が必要になる。
 */
export function visibleFacts(card: ActionCard, now = new Date()) {
  const expired = isExpired(card, now);
  return (card.facts ?? []).filter((fact) => !fact.dated || !expired);
}

export type ServiceWindow = { label: string; start: string; end: string };

/**
 * 受付時間帯から見た、その瞬間の状態。Web とネイティブが同じ規則を使うためにここへ置く。
 *
 * - `unknown`: 受付時間帯を持たないカード。表示を足さない（既存カードの挙動を変えない）
 * - `before` : 最初の枠より前。今から向かうと開く前に着く
 * - `open`   : 枠の中。**告知どおりなら**受け取れる
 * - `between`: 枠と枠の間。**現地は閉まっている**
 * - `closed` : 最終枠より後。通常は isExpired が先に立つ（最終枠の end ＝ expiresAt のため）
 *
 * 境界は `start <= now < end` を「開いている」とする。開始は含み、終了は含まない。
 * isExpired が `now >= expiresAt` で失効側へ倒れるのと向きは逆だが、どちらも
 * 「閉まっている方へ倒す」という意味で安全側で揃っている。
 *
 * この関数は嘘をつく方向が非対称であることを前提にしている。「時間外」は告知に
 * 書かれた事実から断定してよいが、「時間内」は中止・早期終了がありうるので
 * 断定してはいけない。文言側でその差を付ける（docs/design/screens.md）。
 */
export function serviceWindow(
  card: ActionCard,
  now = new Date(),
):
  | { state: "unknown" }
  | { state: "before"; next: ServiceWindow }
  | { state: "open"; current: ServiceWindow }
  | { state: "between"; next: ServiceWindow }
  | { state: "closed" } {
  const windows = card.availableWindows;
  if (!windows || windows.length === 0) return { state: "unknown" };

  const at = now.getTime();
  const sorted = [...windows].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  for (const [index, window] of sorted.entries()) {
    const start = new Date(window.start).getTime();
    const end = new Date(window.end).getTime();
    // 最初の枠より前は「まだ始まっていない」、2つ目以降の枠の前は「いまは間の時間」。
    // 前者は待てば開くが、後者は一度閉まっているので、利用者に伝えるべきことが違う。
    if (at < start) return index === 0 ? { state: "before", next: window } : { state: "between", next: window };
    if (at < end) return { state: "open", current: window };
  }
  return { state: "closed" };
}

/**
 * いまから指定時刻までの残り。`formatRelativeTime` の未来向け。
 *
 * 「17:00まで」だけでは、移動時間を足すと間に合わないことに気づけない。
 * 切り捨てで出す（「あと1時間」と言って59分しかない、を作らない）。
 */
export function formatRemaining(value: string, now: Date) {
  const diffMinutes = Math.floor((new Date(value).getTime() - now.getTime()) / 60000);
  if (diffMinutes < 1) return "まもなく終了";
  if (diffMinutes < 60) return `あと約${diffMinutes}分`;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (hours >= 24) return `あと約${Math.floor(hours / 24)}日`;
  return minutes === 0 ? `あと約${hours}時間` : `あと約${hours}時間${minutes}分`;
}

/** 受付時間帯の表示用。出典の告知が「9:00〜11:00」と書く形に合わせる。 */
export function formatClock(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

/**
 * 受付時間帯をそのまま利用者向けの一文にしたもの。Web とネイティブで同じ文言を使うため、
 * 判定だけでなく文言もここに置く。片方の文言だけ古くなると、同じアプリの利用者が
 * 違う強さの案内を受け取ることになる。
 *
 * **断定してよい方向が非対称であることが、この関数の要点。**
 * 「いまは受付時間外」は告知に書かれた時刻からの帰結なので言い切ってよい。
 * 「いまは受け取れる」は中止・早期終了がありうるので言い切ってはいけない。
 * だから open のときだけ「告知では」と条件を付け、必ず出発前の確認を促す。
 *
 * 期限切れのカードでは呼ばない（期限切れの表示が排他で優先する）。
 */
export function serviceWindowNotice(
  card: ActionCard,
  now = new Date(),
): { tone: "open" | "waiting" | "closed"; headline: string; detail: string } | null {
  const window = serviceWindow(card, now);
  const verify = "出発前に当日の掲載を確認してください。";

  switch (window.state) {
    case "unknown":
      return null;
    case "before":
      return {
        tone: "waiting",
        headline: "本日の受付はまだ始まっていません",
        detail: `${window.next.label}は${formatClock(window.next.start)}からの予定です。${verify}`,
      };
    case "open":
      return {
        tone: "open",
        headline: "告知では受付時間内です",
        detail:
          `${window.current.label} ${formatClock(window.current.start)}〜${formatClock(window.current.end)}` +
          `（${formatRemaining(window.current.end, now)}）。中止・早期終了があるため、${verify}`,
      };
    case "between":
      return {
        tone: "closed",
        headline: "いまは受付時間外です",
        detail:
          `次の回は${window.next.label} ${formatClock(window.next.start)}〜${formatClock(window.next.end)}` +
          `の予定です。${verify}`,
      };
    case "closed":
      return {
        tone: "closed",
        headline: "本日の受付は終了しました",
        detail: `次の予定は公式の告知で確認してください。`,
      };
  }
}

export type AreaCoverage = {
  area: (typeof municipalities)[number];
  /** その市町村を名指ししているカードの数。県全域カードは含めない。 */
  localCount: number;
  /** localCount のうち期限切れの数。 */
  expiredCount: number;
  /** localCount のうち出典で確認できていない（sourceStatus:"unavailable"）数。 */
  unverifiedCount: number;
  /** そこにいても使える県全域カードの数。県全域タイル自身では 0（自分の localCount と同じものになるため）。 */
  wideCount: number;
  /** 表示の調子。緑を成功色に使わないため、良い状態を表す名前は置かない。 */
  tone: "covered" | "partial" | "expired" | "none";
};

/**
 * 市町村ごとに「公式ページで確認できた案内が何件あるか」を数えたもの。
 * Web とネイティブが同じ数字を出すためにここへ置く。
 *
 * **これはカバレッジであって、現地の稼働状況ではない。**
 * 数えているのは「このアプリが出典を確認できた案内の枚数」で、給水車が今いるか、
 * 配布が続いているかは含まない（`docs/design/concept.md` の「引き受けない範囲」）。
 * 画面側は必ずその旨を添えて出す。件数だけを地図状に並べると「多い＝安全」と読まれる。
 *
 * 絞り込み（`app/home-client.tsx` の filtered）は「県全域カードはどの市町村でも出す」
 * という緩い規則を使うが、ここでは **その市町村を名指ししているカードだけ** を数える。
 * 緩い規則で数えると全タイルに県全域の5件が乗り、どの市町村も同じくらい手厚く見える。
 * 宇土市のように固有の案内が1枚も無い地域を 0 と出すことが、この関数の目的である。
 * 代わりに「そこでも使える県全域の案内」を `wideCount` として別枠で返し、
 * 0 件を「この地域には何も無い」と読ませないようにする。
 */
export function areaCoverage(now = new Date()): AreaCoverage[] {
  const wideCards = actionCards.filter((card) => card.areas.includes("熊本県全域"));

  return municipalities.map((area) => {
    const local = actionCards.filter((card) => card.areas.includes(area));
    const expiredCount = local.filter((card) => isExpired(card, now)).length;
    const unverifiedCount = local.filter((card) => card.sourceStatus === "unavailable").length;

    // 期限切れと未確認は別の欠け方なので、片方だけで covered へ倒さない。
    // 「全部期限切れ」は「一部だけ期限切れ」より重いので、先に判定する。
    let tone: AreaCoverage["tone"];
    if (local.length === 0) tone = "none";
    else if (expiredCount === local.length) tone = "expired";
    else if (expiredCount > 0 || unverifiedCount > 0) tone = "partial";
    else tone = "covered";

    return {
      area,
      localCount: local.length,
      expiredCount,
      unverifiedCount,
      // 県全域タイルでは県全域カードが自分の localCount なので、足すと二重計上になる。
      wideCount: area === "熊本県全域" ? 0 : wideCards.length,
      tone,
    };
  });
}
