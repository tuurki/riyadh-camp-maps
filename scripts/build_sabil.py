#!/usr/bin/env python3
"""Build data/sabil.json: free drinking-water points (ماء سبيل) from the public Google Maps list "مارد ماء".

Usage:
    python3 scripts/build_sabil.py            # build from data/source/sabil_list.json
    python3 scripts/build_sabil.py --fetch    # re-download the list from Google Maps first

Only the place name, note, position and date added are kept; the list owner's details are not stored.
"""
import json
import math
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

LIST_ID = "AS-mmlsXDV7Ch40OTImdd2zThu84GQ"
LIST_URL = f"https://www.google.com/maps/placelists/list/{LIST_ID}"
API = ("https://www.google.com/maps/preview/entitylist/getlist?authuser=0&hl=ar&gl=sa"
       f"&pb=!1m4!1s{LIST_ID}!2e1!3m1!1e1!2e2!3e2!4i5000!6m3!1s!7e81!28e2!8i3!16b1")
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "source" / "sabil_list.json"
OUT = ROOT / "data" / "sabil.json"

# Titles that carry no information: raw coordinates or Google's "dropped pin" label.
GENERIC = re.compile(r"""^\s*(\d+°\d+'[\d.]+"[NS]\s+\d+°\d+'[\d.]+"[EW]|(ال)?دبوس المثبّت|(ال)?دبوس مثبّت|(ال)?دبوس مثبت|Dropped pin)\s*$""")


def fetch():
    req = urllib.request.Request(API, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=90) as r:
        raw = r.read().decode("utf-8")
    data = json.loads(raw[raw.index("\n") + 1:])  # strip the )]}' guard line
    lst = data[0]
    entries = []
    for e in lst[8] or []:
        try:
            lat, lng = e[1][5][2], e[1][5][3]
        except (TypeError, IndexError):
            continue
        added = e[9][0] if e[9] else None
        entries.append({"name": (e[2] or "").strip(), "note": (e[3] or "").strip(),
                        "lat": lat, "lng": lng, "added": added})
    SRC.write_text(json.dumps({"title": lst[4], "url": LIST_URL, "entries": entries},
                              ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"Saved {len(entries)} entries to {SRC}")


def haversine(a, b):
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = p2 - p1, math.radians(b[1] - a[1])
    x = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 12742 * math.asin(math.sqrt(x))


def main():
    if "--fetch" in sys.argv or not SRC.exists():
        fetch()
    src = json.loads(SRC.read_text(encoding="utf-8"))

    # Reference towns for "near ..." labels: the map's towns plus the major cities.
    places = json.loads((ROOT / "data" / "places.json").read_text(encoding="utf-8"))
    towns_ci = [i for i, c in enumerate(places["meta"]["categories"]) if c["key"] == "towns"][0]
    towns = [(p[0], (p[2], p[3])) for p in places["points"] if p[1] == towns_ci and p[0]]
    regions = json.loads((ROOT / "data" / "regions.json").read_text(encoding="utf-8"))
    towns += [(c["ar"], (c["lat"], c["lng"])) for c in regions["cities"]]

    seen, out = set(), []
    for e in src["entries"]:
        key = (round(e["lat"], 5), round(e["lng"], 5))
        if key in seen:
            continue
        seen.add(key)
        name = "" if GENERIC.match(e["name"]) else e["name"]
        note = e["note"] if e["note"] != name else ""
        near, km = min(((n, haversine(key, p)) for n, p in towns), key=lambda x: x[1])
        added = datetime.fromtimestamp(e["added"], timezone.utc).strftime("%Y-%m-%d") if e.get("added") else ""
        # [name, note, lat, lng, nearTown, nearKm, dateAdded]
        out.append([name, note, round(e["lat"], 6), round(e["lng"], 6), near, round(km), added])

    OUT.write_text(json.dumps({"title": src["title"], "source": src["url"], "points": out},
                              ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    named = sum(1 for p in out if p[0])
    print(f"{len(out)} water points ({named} with a name) -> {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
