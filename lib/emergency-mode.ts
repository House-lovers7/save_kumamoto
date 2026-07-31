/**
 * 緊急停止スイッチ（Web）。
 *
 * 誤った案内を出したときに、再ビルド・再デプロイなしで個別カードを止めるための唯一の実装。
 * サーバー側だけがこの値を読み、クライアントへは props として渡す。
 *
 * 守ること:
 *
 * - **変数名に `NEXT_PUBLIC_` を付けない。** vinext はビルドプロセスの `NEXT_PUBLIC_*` を
 *   per-key define へ変換し、rsc / ssr を含む全環境へ適用する。値を付けてビルドすると
 *   サーバー側にも定数として焼き付き、以後どの環境変数を変えても停止できなくなる。
 * - **クライアントコンポーネントからこの関数を呼ばない。** クライアントバンドルでは
 *   `process.env` が空オブジェクトへ置換されるため、常に false になる。
 * - **モジュールのトップレベルで値を確定させない。** `vinext start` は Node 常駐なので
 *   一度しか評価されず、実行中の切り替えが効かなくなる。呼び出しのたびに読む。
 */
export const EMERGENCY_MODE_ENV_KEY = "EMERGENCY_MODE";

export function readEmergencyMode(): boolean {
  return process.env[EMERGENCY_MODE_ENV_KEY] === "true";
}
