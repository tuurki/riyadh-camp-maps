#!/usr/bin/env python3
"""Build data/reserves.json: Saudi royal reserves and National Center for Wildlife protected areas.

Inputs (in data/source/):
  reserves_research.json   rules, permits, websites and sources collected from official reserve
                           authority sites, the National Center for Wildlife, SPA and news (see each
                           record's `sources` and `confidence`).
  reserves_osm/<key>.json  boundaries from OpenStreetMap via Nominatim (© OpenStreetMap contributors, ODbL).

Usage:
    python3 scripts/build_reserves.py            # build from the saved sources
    python3 scripts/build_reserves.py --fetch    # re-query Nominatim for boundaries first

Requires: shapely
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from shapely.geometry import shape

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "source"
RESEARCH = SRC / "reserves_research.json"
OSM_DIR = SRC / "reserves_osm"
OUT = ROOT / "data" / "reserves.json"

# Nominatim search names to try for each reserve, in order (first hit wins).
SEARCH = {
    "imam-saud-bin-abdulaziz-royal-reserve": ["محمية محازة الصيد"],
}
# Positions confirmed on Wikidata for reserves OpenStreetMap only has as a point.
WIKIDATA_POINTS = {
    "umm-al-qamari-islands": (18.9829, 41.1008),  # Q-item "محمية جزر أم القماري"
}

REGIONS = {
    "Riyadh": "الرياض", "Makkah": "مكة المكرمة", "Madinah": "المدينة المنورة", "Eastern Province": "الشرقية",
    "Qassim": "القصيم", "Hail": "حائل", "Tabuk": "تبوك", "Northern Borders": "الحدود الشمالية",
    "Jazan": "جازان", "Najran": "نجران", "Al-Baha": "الباحة", "Al-Jouf": "الجوف", "Asir": "عسير",
}


def nominatim(q):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({
        "q": q, "format": "jsonv2", "countrycodes": "sa", "limit": 5,
        "polygon_geojson": 1, "polygon_threshold": 0.003})
    req = urllib.request.Request(url, headers={"User-Agent": "riyadh-camp-maps-build/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return [x for x in json.load(r) if x.get("category") in ("leisure", "boundary", "place")]


def fetch(research):
    OSM_DIR.mkdir(parents=True, exist_ok=True)
    for r in research["reserves"]:
        names = SEARCH.get(r["key"], []) + [r["name_ar"], r["name_ar"].replace(" الملكية", ""), r["name_en"]]
        found = []
        for n in names:
            found = nominatim(n)
            time.sleep(1.1)  # Nominatim usage policy: max 1 request per second
            if found:
                break
        (OSM_DIR / f"{r['key']}.json").write_text(json.dumps(found, ensure_ascii=False), encoding="utf-8")
        print(r["key"], "->", found[0]["display_name"] if found else "not found")


def split_text(s):
    """Turn a paragraph into short bullet strings."""
    if not s:
        return []
    parts = re.split(r"[;؛]\s*|(?<=[.!؟])\s+(?=\S)", s)
    return [p.strip(" .") for p in parts if p and p.strip(" .")]


def rings(geom):
    polys = [geom] if geom.geom_type == "Polygon" else [g for g in getattr(geom, "geoms", []) if g.geom_type == "Polygon"]
    return [[[[round(y, 4), round(x, 4)] for x, y in ring.coords] for ring in [p.exterior, *p.interiors]] for p in polys]


def main():
    research = json.loads(RESEARCH.read_text(encoding="utf-8"))
    if "--fetch" in sys.argv:
        fetch(research)

    out = []
    for r in research["reserves"]:
        poly, center, boundary = None, None, None
        f = OSM_DIR / f"{r['key']}.json"
        hits = json.loads(f.read_text(encoding="utf-8")) if f.exists() else []
        if hits and hits[0]["geojson"]["type"] in ("Polygon", "MultiPolygon"):
            geom = shape(hits[0]["geojson"]).simplify(0.004, preserve_topology=True)
            poly = rings(geom)
            p = geom.representative_point()
            center = [round(p.y, 4), round(p.x, 4)]
            boundary = "osm"
        elif r["key"] in WIKIDATA_POINTS:
            center = list(WIKIDATA_POINTS[r["key"]])
            boundary = "point"
        # Research `center` values are rough estimates, so they are not used for the map.

        permits = r.get("permits") or {}
        out.append({
            "key": r["key"], "name_ar": r["name_ar"], "name_en": r["name_en"], "type": r["type"],
            "region_en": "، ".join(r.get("region") or []).replace("، ", ", "),
            "region_ar": "، ".join(REGIONS.get(x, x) for x in (r.get("region") or [])),
            "area_km2": r.get("area_km2"), "center": center, "boundary": boundary, "poly": poly,
            "website": r.get("website"),
            "allowed": r.get("allowed") or {"ar": [], "en": []},
            "not_allowed": r.get("not_allowed") or {"ar": [], "en": []},
            "permits": {"ar": split_text(permits.get("ar")), "en": split_text(permits.get("en"))},
            "includes_former": r.get("includes_former") or [],
            "sources": r.get("sources") or [],
            "confidence": r.get("confidence"),
        })

    g = research.get("general_rules", {})
    data = {
        "generated": research.get("generated"),
        "boundaries": "© OpenStreetMap contributors (ODbL), via Nominatim",
        "general_rules": {"ar": g.get("ar", []), "en": g.get("en", []), "sources": g.get("sources", [])},
        "reserves": out,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    n_poly = sum(1 for x in out if x["poly"])
    n_none = [x["key"] for x in out if not x["center"]]
    print(f"{len(out)} reserves ({n_poly} with boundaries) -> {OUT} ({OUT.stat().st_size // 1024} KB)")
    if n_none:
        print("no verified location:", ", ".join(n_none))


if __name__ == "__main__":
    main()
