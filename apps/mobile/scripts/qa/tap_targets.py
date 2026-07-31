#!/usr/bin/env python3
"""エミュレータ上の実描画から、タップ可能要素のサイズを dp で実測する。

uiautomator dump の bounds は px なので、`wm density` で得た実密度で dp へ戻す。
44dp（iOS HIG）と 48dp（Material）の両方で不足件数を出す。
"""
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

BOUNDS = re.compile(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]")


def sh(*args: str) -> str:
    return subprocess.run(
        ["adb", *args], capture_output=True, text=True, check=True
    ).stdout


def density() -> float:
    out = sh("shell", "wm", "density")
    # "Physical density: 420" / 上書きがあれば "Override density: 440"
    override = re.search(r"Override density:\s*(\d+)", out)
    physical = re.search(r"Physical density:\s*(\d+)", out)
    dpi = int((override or physical).group(1))
    return dpi / 160.0


def dump_xml() -> str:
    sh("shell", "uiautomator", "dump", "/sdcard/ui.xml")
    return sh("shell", "cat", "/sdcard/ui.xml")


def main() -> int:
    label = sys.argv[1] if len(sys.argv) > 1 else "current"
    scale = density()
    root = ET.fromstring(dump_xml())

    rows = []
    for node in root.iter("node"):
        if node.get("clickable") != "true":
            continue
        m = BOUNDS.match(node.get("bounds", ""))
        if not m:
            continue
        x1, y1, x2, y2 = (int(v) for v in m.groups())
        w_dp = (x2 - x1) / scale
        h_dp = (y2 - y1) / scale
        if w_dp <= 0 or h_dp <= 0:
            continue  # 画面外・非表示
        name = (
            node.get("content-desc")
            or node.get("text")
            or node.get("resource-id")
            or node.get("class", "?")
        )
        rows.append((round(w_dp, 1), round(h_dp, 1), name[:60]))

    under44 = [r for r in rows if min(r[0], r[1]) < 44]
    under48 = [r for r in rows if min(r[0], r[1]) < 48]

    print(f"## {label}  (density {scale:.3f}x, clickable {len(rows)}件)")
    print(f"44dp未満: {len(under44)}件 / 48dp未満: {len(under48)}件")
    for w, h, name in sorted(under48, key=lambda r: min(r[0], r[1])):
        flag = "44NG" if min(w, h) < 44 else "48NG"
        print(f"  [{flag}] {w}x{h}dp  {name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
