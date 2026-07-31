#!/usr/bin/env python3
"""エミュレータ上のアプリを content-desc / text で操作するヘルパー。

座標のハードコードを避ける（文字サイズやダークモードで座標が動くため）。

  ui.py find  "文字の大きさ"       要素を列挙
  ui.py tap   "文字の大きさ 特大"   部分一致でタップ
  ui.py shot  out.png              スクリーンショット保存
  ui.py text                       画面上のテキストを読み上げ順に出力
"""
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

BOUNDS = re.compile(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]")


def sh(*args: str, binary: bool = False):
    r = subprocess.run(["adb", *args], capture_output=True, check=True)
    return r.stdout if binary else r.stdout.decode("utf-8", "replace")


def nodes():
    sh("shell", "uiautomator", "dump", "/sdcard/ui.xml")
    root = ET.fromstring(sh("shell", "cat", "/sdcard/ui.xml"))
    out = []
    for n in root.iter("node"):
        m = BOUNDS.match(n.get("bounds", ""))
        if not m:
            continue
        x1, y1, x2, y2 = (int(v) for v in m.groups())
        out.append(
            {
                "desc": n.get("content-desc", ""),
                "text": n.get("text", ""),
                "cls": n.get("class", ""),
                "clickable": n.get("clickable") == "true",
                "box": (x1, y1, x2, y2),
                "cx": (x1 + x2) // 2,
                "cy": (y1 + y2) // 2,
                "w": x2 - x1,
                "h": y2 - y1,
            }
        )
    return out


def match(q):
    hits = [n for n in nodes() if q in n["desc"] or q in n["text"]]
    return hits


def main() -> int:
    cmd = sys.argv[1]
    if cmd == "find":
        for n in match(sys.argv[2]):
            print(
                f"{'CLICK' if n['clickable'] else '     '} "
                f"{n['w']}x{n['h']}px @({n['cx']},{n['cy']}) "
                f"desc={n['desc'][:50]!r} text={n['text'][:50]!r}"
            )
    elif cmd == "tap":
        hits = [n for n in match(sys.argv[2])]
        clickable = [n for n in hits if n["clickable"]] or hits
        if not clickable:
            print(f"NOT FOUND: {sys.argv[2]}", file=sys.stderr)
            return 1
        n = clickable[0]
        sh("shell", "input", "tap", str(n["cx"]), str(n["cy"]))
        print(f"tapped {n['desc'] or n['text']!r} @({n['cx']},{n['cy']})")
    elif cmd == "shot":
        data = sh("exec-out", "screencap", "-p", binary=True)
        with open(sys.argv[2], "wb") as f:
            f.write(data)
        print(f"saved {sys.argv[2]} ({len(data)} bytes)")
    elif cmd == "text":
        for n in nodes():
            label = n["desc"] or n["text"]
            if label:
                print(label)
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
