#!/usr/bin/env python3
"""Convert the Google My Maps KML export into compact JSON used by the website.

Usage:
    python3 scripts/build_data.py            # use data/source/riyadh-wild-map.kml
    python3 scripts/build_data.py --fetch    # re-download the KML from Google My Maps first
"""
import json
import math
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

MAP_ID = "1zDvUx5fza1RvGTDpoDrx2YeMRrmvbNKe"
KML_URL = f"https://www.google.com/maps/d/kml?mid={MAP_ID}&forcekml=1"
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "source" / "riyadh-wild-map.kml"
OUT = ROOT / "data"
NS = {"k": "http://www.opengis.net/kml/2.2"}

# KML folder name -> category key. Both water-basin folders share one category.
FOLDER_CATEGORY = {
    "أسماء رئيسة": "towns",
    "أسماء ثانوية": "local",
    "جبال": "mountains",
    "تجمع مياه 1": "valleys",
    "تجمع مياه 2": "valleys",
    "موارد مياه": "water",
    "نفود": "dunes",
    "مواقع اثرية": "heritage",
    "طرق صحراوية": "roads",
    "حدود": "boundaries",
}

# Order here is the order shown in the UI.
CATEGORIES = [
    {"key": "towns", "ar": "مدن وقرى", "en": "Towns", "color": "#D93025"},
    {"key": "local", "ar": "أسماء محلية", "en": "Local names", "color": "#6B7280"},
    {"key": "mountains", "ar": "جبال وهضاب", "en": "Mountains", "color": "#8D5B3E"},
    {"key": "valleys", "ar": "أودية وخباري", "en": "Valleys & basins", "color": "#1A73E8"},
    {"key": "water", "ar": "آبار ومياه", "en": "Wells & water", "color": "#188038"},
    {"key": "dunes", "ar": "نفود وعروق", "en": "Sand dunes", "color": "#E3A008"},
    {"key": "heritage", "ar": "آثار", "en": "Heritage", "color": "#8E24AA"},
    {"key": "roads", "ar": "طرق صحراوية", "en": "Desert tracks", "color": "#3C4043"},
    {"key": "boundaries", "ar": "حدود ومناطق مغلقة", "en": "Boundaries", "color": "#00838F"},
]
CAT_INDEX = {c["key"]: i for i, c in enumerate(CATEGORIES)}


def haversine_km(lat1, lng1, lat2, lng2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def parse_coords(text):
    pts = []
    for chunk in (text or "").split():
        parts = chunk.split(",")
        if len(parts) >= 2:
            pts.append((float(parts[1]), float(parts[0])))  # (lat, lng)
    return pts


def clean(s):
    return " ".join((s or "").split())


def main():
    if "--fetch" in sys.argv:
        print(f"Downloading {KML_URL}")
        SRC.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(KML_URL) as r:
            SRC.write_bytes(r.read())

    doc = ET.parse(SRC).getroot().find("k:Document", NS)
    title = clean(doc.findtext("k:name", namespaces=NS))

    points, lines = [], []
    for folder in doc.findall("k:Folder", NS):
        fname = clean(folder.findtext("k:name", namespaces=NS))
        cat = FOLDER_CATEGORY.get(fname)
        if cat is None:
            print(f"warning: unknown folder {fname!r}, skipping")
            continue
        for pm in folder.iter("{%s}Placemark" % NS["k"]):
            name = clean(pm.findtext("k:name", namespaces=NS))
            desc = clean(pm.findtext("k:description", namespaces=NS))
            if desc == name:
                desc = ""
            pt = pm.find(".//k:Point/k:coordinates", NS)
            if pt is not None:
                lat, lng = parse_coords(pt.text)[0]
                points.append({"name": name, "desc": desc, "cat": cat, "lat": lat, "lng": lng})
                continue
            for ls in pm.findall(".//k:LineString/k:coordinates", NS):
                pts = parse_coords(ls.text)
                if len(pts) >= 2:
                    lines.append({"name": name, "cat": cat, "pts": pts})

    # Nearest town/village for each point (helps tell apart duplicate names).
    towns = [p for p in points if p["cat"] == "towns" and p["name"]]
    for p in points:
        best, best_d = None, float("inf")
        for t in towns:
            if t is p:
                continue
            d = haversine_km(p["lat"], p["lng"], t["lat"], t["lng"])
            if d < best_d:
                best, best_d = t, d
        p["near"] = best["name"] if best else ""
        p["nearKm"] = round(best_d) if best else None

    # Compact arrays: [name, catIndex, lat, lng, nearName, nearKm, desc]
    out_points = [
        [p["name"], CAT_INDEX[p["cat"]], round(p["lat"], 6), round(p["lng"], 6), p["near"], p["nearKm"], p["desc"]]
        for p in points
    ]
    out_lines = [
        [l["name"], CAT_INDEX[l["cat"]], [[round(a, 5), round(b, 5)] for a, b in l["pts"]]]
        for l in lines
    ]
    meta = {
        "title": title,
        "source": f"https://www.google.com/maps/d/viewer?mid={MAP_ID}",
        "categories": CATEGORIES,
    }

    OUT.mkdir(exist_ok=True)
    with open(OUT / "places.json", "w", encoding="utf-8") as f:
        json.dump({"meta": meta, "points": out_points}, f, ensure_ascii=False, separators=(",", ":"))
    with open(OUT / "lines.json", "w", encoding="utf-8") as f:
        json.dump({"lines": out_lines}, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{len(out_points)} points, {len(out_lines)} lines written to {OUT}")


if __name__ == "__main__":
    main()
