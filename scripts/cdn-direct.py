#!/usr/bin/env python3
"""
cdn-direct — resolve an as-cdn<NN>.top FirePlayer embed URL into a direct
HLS playlist, with your choice of default audio language.

Usage:
    python3 cdn-direct.py                    # interactive: asks for URL + audio
    python3 cdn-direct.py <url-or-hash>      # asks only for the audio language

Output:
    - prints the direct master.m3u8 URL (signed for YOUR ip, ~2h expiry)
    - writes <lang>.m3u8 next to the script: a copy of the master playlist
      with your language flagged DEFAULT=YES and all URIs made absolute —
      open this file in VLC and it starts on your chosen dub.

Requires: Python 3.8+ (standard library only — no pip installs).
"""

import json
import re
import sys
import urllib.request
import urllib.parse
from datetime import datetime
from pathlib import Path

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

EMBED_RE = re.compile(r"^https?://as-cdn\d+\.top/video/([a-f0-9]{8,64})/?$", re.I)
HASH_RE = re.compile(r"^[a-f0-9]{8,64}$", re.I)
AUDIO_LINE_RE = re.compile(r"^#EXT-X-MEDIA:TYPE=AUDIO")
LANG_RE = re.compile(r'LANGUAGE="([^"]*)"')
NAME_RE = re.compile(r'NAME="([^"]*)"')


def http_post(url: str, data: dict) -> dict:
    body = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "User-Agent": UA,
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode())


def http_get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read().decode("utf-8", errors="replace")


def main() -> None:
    # ----------------------------------------------------------- input url
    url = sys.argv[1] if len(sys.argv) > 1 else ""
    if not url:
        url = input("Paste the embed URL (e.g. https://as-cdn26.top/video/<hash>): ")
    url = url.strip()

    match = EMBED_RE.match(url)
    if match:
        video_hash = match.group(1).lower()
    elif HASH_RE.match(url):
        video_hash = url.lower()
    else:
        sys.exit("✗ That doesn't look like an as-cdn embed URL or hash.")

    print(f"→ hash: {video_hash}")

    # -------------------------------------------------------- resolve link
    try:
        data = http_post(
            f"https://as-cdn26.top/player/index.php?data={video_hash}&do=getVideo",
            {"hash": video_hash, "r": ""},
        )
    except Exception as exc:
        sys.exit(f"✗ Could not resolve this hash: {exc}")

    master = data.get("securedLink") or data.get("videoSource")
    if not master or not master.startswith("http"):
        sys.exit("✗ CDN returned no link for this hash.")

    host = urllib.parse.urlsplit(master).netloc
    query = urllib.parse.parse_qs(urllib.parse.urlsplit(master).query)
    expires = query.get("expires", [None])[0]

    print("→ direct master URL:")
    print(f"    {master}")
    if expires and expires.isdigit():
        when = datetime.fromtimestamp(int(expires)).strftime("%Y-%m-%d %H:%M:%S")
        print(f"    (valid until {when})")

    # ------------------------------------------------------ fetch playlist
    try:
        playlist = http_get(master)
    except Exception as exc:
        sys.exit(f"✗ Master playlist fetch failed: {exc}")

    audio_lines = [ln for ln in playlist.splitlines() if AUDIO_LINE_RE.match(ln)]

    if not audio_lines:
        print("→ This video has a single audio track (no dub selection needed).")
        print("  Play the master URL above directly in VLC.")
        return

    tracks = []
    for line in audio_lines:
        lang = LANG_RE.search(line)
        name = NAME_RE.search(line)
        if lang:
            tracks.append((lang.group(1), name.group(1) if name else lang.group(1)))

    print("\nAvailable audio languages:")
    for i, (lang, name) in enumerate(tracks, 1):
        print(f"  {i:2d}) {name} ({lang})")

    # ------------------------------------------------------------ pick one
    while True:
        pick = input(f"Select language [1-{len(tracks)}, or Enter for default]: ").strip()
        if not pick:
            selected = None
            break
        if pick.isdigit() and 1 <= int(pick) <= len(tracks):
            selected = tracks[int(pick) - 1][0]
            break
        print(f"  Enter a number between 1 and {len(tracks)} (or just Enter).")

    # ------------------------------------------------- build selected m3u8
    if selected:
        out_path = Path(f"{selected}.m3u8")

        rewritten = []
        for line in playlist.splitlines():
            # Root-relative URIs must become absolute in a local file.
            if line.startswith("/"):
                line = f"https://{host}{line}"
            else:
                line = line.replace('URI="/', f'URI="https://{host}/')
            if AUDIO_LINE_RE.match(line) and f'LANGUAGE="{selected}"' in line:
                line = line.replace("DEFAULT=NO", "DEFAULT=YES")
            rewritten.append(line)
        out_path.write_text("\n".join(rewritten) + "\n", encoding="utf-8")

        audio_uri = ""
        for line in rewritten:
            if AUDIO_LINE_RE.match(line) and f'LANGUAGE="{selected}"' in line:
                m = re.search(r'URI="([^"]*)"', line)
                if m:
                    audio_uri = m.group(1)

        print(f"\n✅ saved: {out_path.resolve()} — open it in VLC (Media → Open File), starts in {selected}")
        print("   (other languages remain switchable via VLC's Audio → Audio Track)")
        print(f"\n   {selected} audio track URL (standalone, audio-only):")
        print(f"     {audio_uri}")
    else:
        print("→ Keeping the playlist's default language order; use the master URL above.")


if __name__ == "__main__":
    main()
