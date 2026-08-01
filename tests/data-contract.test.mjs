import assert from "node:assert/strict";
import test from "node:test";

import {
  actionCards,
  isExpired,
  visibleFacts,
} from "../lib/disaster-data.ts";

// 出典として許可するドメイン。運営主体が公的機関だと確認できたものだけを個別に列挙する。
// ワイルドカードにしない（`*.go.jp` を許すと、内容を見ていないページを通してしまう）。
//
//   pref.kumamoto.jp      熊本県
//   city.kumamoto.jp      熊本市
//   tca.or.jp             一般社団法人 電気通信事業者協会（携帯各社の災害用伝言板の窓口）
//   qsr.mlit.go.jp        国土交通省 九州地方整備局
//   enecho-ss.meti.go.jp  資源エネルギー庁の災害時情報収集システム（住民拠点SS等検索）。
//                         2026-07-31 の巡回で fuel カードの導線として追加。震度5強以上の
//                         地震発生時に給油所の営業状況を都道府県単位で地図表示する公式システム。
//   town.hikawa.kumamoto.jp  氷川町。2026-08-01 の巡回で追加。運営者表記「氷川町」、
//                         法人番号 9000020434680、所在地 熊本県八代郡氷川町島地642番地を
//                         サイト上で確認した。緊急情報ページに水・食料の配布と開設中の避難所が出る。
//   kumamoto-waterworks.jp   熊本市上下水道局。2026-08-01 の応急給水所カード追加で登録。
//                         サイトフッターの運営者表記「熊本市上下水道局
//                         〒862-8620 熊本市中央区水前寺6丁目2-45」と
//                         Copyright「Kumamoto City Waterworks and Sewerage Bureau」を確認した。
//                         トップページが緊急情報の表示面（当日の応急給水所の告知が出る）。
const ALLOWED_SOURCE_HOSTS =
  /^https:\/\/(?:www\.)?(?:pref\.kumamoto\.jp|city\.kumamoto\.jp|tca\.or\.jp|qsr\.mlit\.go\.jp|enecho-ss\.meti\.go\.jp|town\.hikawa\.kumamoto\.jp|kumamoto-waterworks\.jp)\//;

const requiredCategories = [
  "emergency",
  "water",
  "essentials",
  "shelter",
  "medical",
  "communication",
  "transport",
  "recovery",
];

test("全カードが出典・時刻・失効・公式URLを持つ", () => {
  assert.ok(actionCards.length > 0);
  for (const card of actionCards) {
    assert.ok(
      ["official", "unavailable"].includes(card.sourceStatus),
      `${card.id}: sourceStatus は official か unavailable`,
    );
    assert.match(card.sourceUrl, ALLOWED_SOURCE_HOSTS, card.id);
    for (const key of ["publishedAt", "fetchedAt", "checkedAt", "expiresAt"]) {
      assert.equal(Number.isNaN(Date.parse(card[key])), false, `${card.id}:${key}`);
    }
    assert.ok(
      Date.parse(card.publishedAt) <= Date.parse(card.fetchedAt),
      `${card.id}: 発表時刻は取得時刻以前`,
    );
    assert.ok(
      Date.parse(card.checkedAt) <= Date.parse(card.expiresAt),
      `${card.id}: 確認時刻は有効期限以前`,
    );
  }
});

test("全カードが断定しない行動順序ステップを持つ", () => {
  for (const card of actionCards) {
    assert.ok(Array.isArray(card.steps), card.id);
    assert.ok(card.steps.length >= 2 && card.steps.length <= 5, `${card.id}: 2〜5手順`);
    for (const step of card.steps) {
      assert.ok(step.trim().length >= 5 && step.length <= 60, `${card.id}: ${step}`);
      assert.doesNotMatch(
        step,
        /(必ず(開|使え|入れ|もらえ|通れ)|絶対に安全|在庫あり|営業中です|通行できます|受け入れています)/,
        `${card.id}: 断定表現を含めない`,
      );
    }
  }
});

test("困りごとのかな・話し言葉から該当カードへ届く", () => {
  const search = (word) => {
    const q = word.toLowerCase();
    return actionCards.filter((card) =>
      `${card.title} ${card.summary} ${card.steps.join(" ")} ${card.action} ${card.keywords.join(" ")}`
        .toLowerCase()
        .includes(q),
    );
  };
  const expectations = [
    ["こども", "infant-care"],
    ["赤ちゃん", "infant-care"],
    ["おむつ", "infant-care"],
    ["くすり", "medical"],
    ["けが", "medical"],
    ["みず", "water"],
    ["断水", "water"],
    ["ひなん", "shelter"],
    ["ペット", "shelter"],
    ["ごはん", "food-and-supplies"],
    ["ガソリン", "fuel"],
    ["といれ", "toilet"],
    ["充電", "communication"],
    ["安否", "communication"],
    ["お年寄り", "elder-care"],
    ["通行止め", "roads"],
    ["罹災", "kumamoto-city-hub"],
    ["お金", "support-systems"],
  ];
  for (const [word, expectedId] of expectations) {
    const hits = search(word);
    assert.ok(hits.length > 0, `「${word}」で0件`);
    assert.ok(
      hits.some((card) => card.id === expectedId),
      `「${word}」で ${expectedId} に届かない（${hits.map((c) => c.id).join(",")}）`,
    );
  }
});

test("R1必須カテゴリをすべて備える", () => {
  const actual = new Set(actionCards.map((card) => card.category));
  for (const category of requiredCategories) {
    assert.equal(actual.has(category), true, category);
  }
});

// リンクが生きていても、そのページにカードの手順を実行するための情報が無いことがある。
// 2026-07-31 の巡回では、6カードが「リンクは生きているが話題の記載が無い」状態だった。
// 黙って official のままにすると、利用者は行き先に情報があると誤解する。
test("確認できていないカードは、何が確認できていないかを必ず書く", () => {
  for (const card of actionCards) {
    if (card.sourceStatus !== "unavailable") {
      assert.equal(card.unverified, undefined, `${card.id}: official なのに unverified がある`);
      continue;
    }
    assert.ok(
      typeof card.unverified === "string" && card.unverified.trim().length >= 20,
      `${card.id}: unavailable なら unverified に何が無いのかを書く`,
    );
    assert.match(
      card.unverified,
      /確認できませんでした|確認できていません/,
      `${card.id}: 確認できていないことを言い切る`,
    );
  }
});

// リンク先で情報を探させないために、出典の核心情報をカード内へ出す（2026-08-01 ユーザー要望）。
// 出せるのは出典に書かれている記載だけで、住所・時間・電話番号を推測で作らない。
test("カード内の答えは、出典の記載を短く写したものに限る", () => {
  for (const card of actionCards) {
    if (!card.facts) continue;
    assert.ok(card.facts.length >= 1, `${card.id}: facts が空`);
    assert.equal(
      new Set(card.facts.map((fact) => fact.label)).size,
      card.facts.length,
      `${card.id}: 同じ見出しの答えが重複している`,
    );
    for (const fact of card.facts) {
      assert.ok(
        fact.label.trim().length >= 4 && fact.label.length <= 40,
        `${card.id}: 見出しは4〜40字（${fact.label}）`,
      );
      assert.ok(
        fact.items.length >= 1 && fact.items.length <= 15,
        `${card.id}/${fact.label}: 1〜15件（${fact.items.length}件）。これを超える一覧はカードに載せない`,
      );
      assert.equal(
        new Set(fact.items).size,
        fact.items.length,
        `${card.id}/${fact.label}: 項目が重複している`,
      );
      for (const item of fact.items) {
        assert.ok(
          item.trim().length >= 4 && item.length <= 60,
          `${card.id}/${fact.label}: 4〜60字（${item}）`,
        );
        assert.doesNotMatch(
          item,
          /(必ず(開|使え|入れ|もらえ|通れ)|絶対に安全|在庫あり|営業中です|通行できます|受け入れています)/,
          `${card.id}: 断定表現を含めない（${item}）`,
        );
      }
      assert.ok(
        fact.citedAs.trim().length >= 4,
        `${card.id}/${fact.label}: 出典のどこに書かれているかを citedAs に書く`,
      );
    }
  }
});

// 確認できていないカードが、答えを持っているかのように見えてはいけない。
// unavailable のカードに出してよいのは「代わりにどこへ聞けばよいか」だけ。
test("確認できていないカードの答えは問い合わせ先に限る", () => {
  for (const card of actionCards) {
    if (card.sourceStatus !== "unavailable" || !card.facts) continue;
    for (const fact of card.facts) {
      assert.match(
        fact.label,
        /窓口|問い合わせ|問合せ|相談|連絡先/,
        `${card.id}: unavailable なカードに出せるのは問い合わせ先だけ（${fact.label}）`,
      );
    }
  }
});

// 「今日どこで何時に受け取れるか」が本体のカード。リンクを開かせて探させる形へ
// 戻したら、ここで止める。深いURLが存在しない出典なので、探す先の名指しも必須にする。
test("当日限りのカードは、その日の場所と時間をカード内に持つ", () => {
  for (const id of ["water-station", "food-hikawa"]) {
    const card = actionCards.find((item) => item.id === id);
    assert.ok(card, `${id} カードがない`);
    assert.ok(card.facts && card.facts.length >= 1, `${id}: facts が無い`);
    assert.ok(
      card.facts.some((fact) => fact.dated === true),
      `${id}: その日限りの内容には dated を付ける（期限切れで消すため）`,
    );
    assert.ok(
      typeof card.sourceLandmark === "string" && card.sourceLandmark.trim().length >= 4,
      `${id}: 深いURLが無い出典なので sourceLandmark で探す先を名指しする`,
    );
  }
});

// 深いURLが存在しない出典で、開いた最初の画面から探す先を名指しするための目印。
// 出典の実物にある見出し文言をそのまま持ち、巡回のたびに照合する。
test("探す先の名指しは、出典の見出し文言をそのまま持つ", () => {
  for (const card of actionCards) {
    if (!card.sourceLandmark) continue;
    assert.ok(
      card.sourceLandmark.trim().length >= 4 && card.sourceLandmark.length <= 60,
      `${card.id}: sourceLandmark は4〜60字（${card.sourceLandmark}）`,
    );
    // 描画側が「」で囲うので、データ側で二重に付けない。
    assert.doesNotMatch(
      card.sourceLandmark,
      /^[「『]|[」』]$/,
      `${card.id}: カギ括弧は描画側が付ける`,
    );
  }
});

// 混同すると健康被害や無駄足になる区別は、出典ページに実際に書かれているものだけを載せる。
test("確認すべき区別は選択肢と理由をそろえて持つ", () => {
  for (const card of actionCards) {
    if (!card.verifyPoints) continue;
    assert.ok(card.verifyPoints.length >= 1, `${card.id}: verifyPoints が空`);
    for (const point of card.verifyPoints) {
      assert.ok(point.label.trim().length > 0, `${card.id}: label が空`);
      assert.ok(
        point.options.length >= 2,
        `${card.id}/${point.label}: 区別なので選択肢は2件以上`,
      );
      assert.equal(
        new Set(point.options).size,
        point.options.length,
        `${card.id}/${point.label}: 選択肢が重複している`,
      );
      assert.ok(
        point.why.trim().length >= 20,
        `${card.id}/${point.label}: なぜ区別が要るのかを書く`,
      );
    }
  }
});

// このアプリが防ぎたい誤認の代表例。生活用水を飲料水と思って飲ませないための回帰ゲート。
test("給水カードは飲める水かどうかの区別を必ず出す", () => {
  const water = actionCards.find((card) => card.id === "water");
  assert.ok(water, "water カードがない");
  const points = water.verifyPoints ?? [];
  assert.ok(
    points.some(
      (point) =>
        point.options.some((option) => /飲料|飲み水/.test(option)) &&
        point.options.some((option) => /生活用水/.test(option)),
    ),
    "飲料用と生活用水を並べて区別させる verifyPoints が必要",
  );
});

// 「支払ってから知った」「片付けてから知った」は取り返しがつかない。
test("順序を誤ると取り返しがつかない手続きは短く言い切る", () => {
  for (const card of actionCards) {
    if (!card.irreversibleOrder) continue;
    assert.ok(
      card.irreversibleOrder.length >= 2 && card.irreversibleOrder.length <= 5,
      `${card.id}: 2〜5件`,
    );
    for (const item of card.irreversibleOrder) {
      assert.ok(
        item.trim().length >= 5 && item.length <= 60,
        `${card.id}: ${item}`,
      );
    }
  }
});

// 「8月1日の給水所」を8月2日にも見せることは、終了した給水所へ人を向かわせることと同じ。
// 逆に、問い合わせ先のように日付へ依存しない答えは、期限切れでも消してはいけない。
test("その日限りの答えは期限切れで消え、日付に依存しない答えは残る", () => {
  for (const card of actionCards) {
    if (!card.facts?.length) continue;
    const boundary = new Date(card.expiresAt);
    const before = visibleFacts(card, new Date(boundary.getTime() - 1000));
    const after = visibleFacts(card, boundary);
    assert.deepEqual(before, card.facts, `${card.id}: 期限内はすべての答えが出る`);
    assert.deepEqual(
      after,
      card.facts.filter((fact) => !fact.dated),
      `${card.id}: 期限切れで残るのは日付に依存しない答えだけ`,
    );
  }
});

test("期限切れ判定は境界時刻で安全側へ切り替わる", () => {
  const card = actionCards[0];
  const boundary = new Date(card.expiresAt);
  assert.equal(isExpired(card, new Date(boundary.getTime() - 1000)), false);
  assert.equal(isExpired(card, boundary), true);
});
