import { readEmergencyMode } from "@/lib/emergency-mode";
import { HomeClient } from "./home-client";

export default function Home() {
  // 停止フラグはサーバー側だけで読む。ここで読んだ値が RSC ペイロードへ載るので、
  // SSR の初期HTMLとブラウザの hydration が同じ1つの値から描画される。
  return <HomeClient emergencyMode={readEmergencyMode()} />;
}
