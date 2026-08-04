import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

// Worker 設定の正典は `wrangler.jsonc`（`main` / `compatibility_date` /
// `compatibility_flags` / `assets` / `images`）。ここには hosting.json から決まる
// 動的な binding だけを置く。
//
// `compatibility_date` と `compatibility_flags` をここへ書き戻さないこと。
// wrangler.jsonc とマージされて `compatibility_flags` が重複し、Cloudflare API が
// デプロイを拒否する（code 10021）。2026-08-05 に実際に本番デプロイが落ちた。
// 停止スイッチの前提条件としての意味は wrangler.jsonc のコメントに書いてある。
const localBindingConfig = {
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        // 正典を明示する。ここを外すと `vinext deploy` が「設定が無い」と判定して
        // wrangler.jsonc を勝手に作り直し、重複マージでデプロイが落ちる。
        configPath: "./wrangler.jsonc",
        config: localBindingConfig,
      }),
    ],
  };
});
