# Fresh-thread handoff

## Goal

添付仕様を満たす熊本災害行動ナビを、Web・iOS・Androidの3クライアントで本番リリース可能な状態へ完成させる。テスト、ビルド、README、残課題、要件別完成監査まで行う。公開後は `cokomo.gt@gmail.com` へ公開URLと検証結果をメールする。

## Product boundary

- R1読み取り専用
- 公式情報への案内、出典、接続確認時刻、不確実性を表示
- GPS、住所、氏名、健康情報、被害写真、投稿、寄付、配送、広告、分析なし
- WebはPWA、iOS/AndroidはExpo Router
- 個人投稿、支援要請、医療判断、通行・営業・在庫の独自断定は実装しない

## Implemented

- Web: `app/home-client.tsx`, `lib/disaster-data.ts`, `app/globals.css`
- PWA: `public/manifest.webmanifest`, `public/sw.js`
- Web tests: `tests/rendered-html.test.mjs`
- Mobile: Expo SDK 57 / React Native 0.86.2
- Mobile screens: `apps/mobile/src/app/index.tsx`, `offline-guides.tsx`, `about.tsx`
- Mobile config: iOS bundle id / Android package / `eas.json`
- App icon and splash assets

## Verified in this session

- `npm run lint`: PASS
- `npm test`: PASS, 2/2
- Web production build: PASS
- Mobile `npm run typecheck`: PASS
- Mobile `npm run lint`: PASS
- `npx expo-doctor@latest`: PASS, 20/20
- `npm run export:all`: PASS
  - iOS bundle generated
  - Android bundle generated

## Current unresolved items

1. Root `npm audit --omit=dev` reports High through Next-bundled `postcss <=8.5.17` and `sharp <0.35.0`. Next is already `16.2.12`. Do not use `audit fix --force`; investigate safe `overrides` or newer patched compatible packages.
2. Mobile `npm audit --omit=dev` reports Moderate `uuid <11.1.1` through Expo tooling. Consider safe override only after verifying Expo compatibility.
3. Visual/interaction QA in browser has not been completed after implementation.
4. iOS simulator and Android emulator native launch have not been run. JS bundle export passed, but signed native archives are external boundary unverified.
5. README is still the starter and must be replaced with setup, commands, architecture, safety boundary, verified checks, unrun checks, release steps, and remaining issues.
6. Need requirement-by-requirement completion audit.
7. Sites/Vercel deployment and Gmail send are approval-gated. Before production:
   - state exact deployment operation, account/project, production impact, and rollback
   - confirm Gmail sending account and exact email content
   - deploy only after explicit approval
   - after successful public URL verification, email `cokomo.gt@gmail.com`

## Runtime state

- Web dev server started on `http://localhost:3002/`, exec session `44061` (may not survive thread switch).
- Browser tab was opened for the local starter/implementation and should be reclaimed or reopened if needed.
- `.openai/hosting.json` exists with `d1: null`, `r2: null`, no `project_id`; do not call Sites `create_site` more than once if a later turn does.

## Source verification used

- JMA confirmed 2026-07-28 16:27 Kumamoto earthquake M7.1.
- Kumamoto City official current disaster hub: `https://www.city.kumamoto.jp/list04828.html`
- Kumamoto Prefecture disaster prevention section: `https://www.pref.kumamoto.jp/soshiki/222/`
- Expo SDK 57 official upgrade docs and release notes checked on 2026-07-30.

## Next minimal sequence

1. Run guard config; inspect package versions and resolve audit without forced downgrade.
2. Start/reuse Web dev server, browser QA mobile/desktop, accessibility-focused interaction checks.
3. Run Expo native smoke if local simulator/emulator is available without credentials; otherwise document boundary-unverified.
4. Replace README.
5. Run Review Council / harness check/package as ACOS generated instructions require.
6. Run final tests/build/audit and completion audit.
7. Present approval packet for production deployment + post-publish Gmail.
