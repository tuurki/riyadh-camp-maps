#!/usr/bin/env python3
"""Build data/regions.json: Saudi Arabia's 13 administrative regions (provinces) and major cities.

Province boundaries come from Natural Earth (public domain), admin-1 10m.
City positions come from Natural Earth populated places, with a few cities added by hand
where Natural Earth is missing them or has a wrong name.

Usage:
    python3 scripts/build_regions.py            # uses data/source/ne_sau_admin1.geojson
    python3 scripts/build_regions.py --fetch    # re-download Natural Earth admin-1 first (~40 MB)

Requires: shapely (pip install shapely)
"""
import json
import sys
import urllib.request
from pathlib import Path

from shapely.geometry import shape, mapping
from shapely.ops import transform  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "source" / "ne_sau_admin1.geojson"
OUT = ROOT / "data" / "regions.json"
NE_URL = ("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
          "ne_10m_admin_1_states_provinces.geojson")

# ISO 3166-2 code -> names and capital. Arabic names follow the official form without "منطقة".
PROVINCES = {
    "SA-01": ("الرياض", "Riyadh", "الرياض", "Riyadh"),
    "SA-02": ("مكة المكرمة", "Makkah", "مكة المكرمة", "Makkah"),
    "SA-03": ("المدينة المنورة", "Madinah", "المدينة المنورة", "Madinah"),
    "SA-04": ("الشرقية", "Eastern Province", "الدمام", "Dammam"),
    "SA-05": ("القصيم", "Qassim", "بريدة", "Buraydah"),
    "SA-06": ("حائل", "Hail", "حائل", "Hail"),
    "SA-07": ("تبوك", "Tabuk", "تبوك", "Tabuk"),
    "SA-08": ("الحدود الشمالية", "Northern Borders", "عرعر", "Arar"),
    "SA-09": ("جازان", "Jazan", "جازان", "Jazan"),
    "SA-10": ("نجران", "Najran", "نجران", "Najran"),
    "SA-11": ("الباحة", "Al Bahah", "الباحة", "Al Bahah"),
    "SA-12": ("الجوف", "Al Jawf", "سكاكا", "Sakaka"),
    "SA-14": ("عسير", "Asir", "أبها", "Abha"),
}

# Major cities: (ar, en, lat, lng, rank). rank 1 = largest cities, shown at every zoom.
# Positions from Natural Earth populated places where available; the rest are city centres.
CITIES = [
    ("الرياض", "Riyadh", 24.6428, 46.7708, 1),
    ("جدة", "Jeddah", 21.5188, 39.2173, 1),
    ("مكة المكرمة", "Makkah", 21.4220, 39.8262, 1),
    ("المدينة المنورة", "Madinah", 24.4672, 39.6111, 1),
    ("الدمام", "Dammam", 26.4301, 50.0977, 1),
    ("الطائف", "Taif", 21.2622, 40.3823, 2),
    ("تبوك", "Tabuk", 28.3838, 36.5550, 2),
    ("بريدة", "Buraydah", 26.3664, 43.9628, 2),
    ("حائل", "Hail", 27.5236, 41.7001, 2),
    ("أبها", "Abha", 18.2301, 42.5001, 2),
    ("خميس مشيط", "Khamis Mushait", 18.3000, 42.7333, 2),
    ("نجران", "Najran", 17.5065, 44.1316, 2),
    ("جازان", "Jazan", 16.8892, 42.5511, 2),
    ("الهفوف", "Hofuf", 25.3487, 49.5856, 2),
    ("الخبر", "Khobar", 26.2794, 50.2083, 2),
    ("الجبيل", "Jubail", 27.0046, 49.6460, 2),
    ("القطيف", "Qatif", 26.5196, 50.0115, 3),
    ("الظهران", "Dhahran", 26.2914, 50.1583, 3),
    ("حفر الباطن", "Hafar Al-Batin", 28.4337, 45.9601, 2),
    ("الخرج", "Al Kharj", 24.1556, 47.3120, 2),
    ("ينبع", "Yanbu", 24.0943, 38.0493, 2),
    ("عرعر", "Arar", 30.9900, 41.0207, 2),
    ("سكاكا", "Sakaka", 29.9697, 40.2064, 2),
    ("الباحة", "Al Bahah", 20.0129, 41.4677, 2),
    ("عنيزة", "Unaizah", 26.0840, 43.9935, 3),
    ("العلا", "AlUla", 26.6085, 37.9232, 3),
    ("بيشة", "Bisha", 20.0087, 42.5987, 3),
    ("القريات", "Al Qurayyat", 31.3318, 37.3428, 3),
    ("رفحاء", "Rafha", 29.6202, 43.4948, 3),
    ("الوجه", "Al Wajh", 26.2324, 36.4636, 3),
    ("دومة الجندل", "Dumat al-Jandal", 29.8153, 39.8664, 3),
    ("وادي الدواسر", "Wadi ad-Dawasir", 20.4607, 44.7816, 3),
    ("السليل", "As Sulayyil", 20.4623, 45.5722, 3),
    ("القويعية", "Al Quwayiyah", 24.0737, 45.2806, 3),
    ("الدوادمي", "Ad Dawadimi", 24.5075, 44.3924, 3),
    ("المجمعة", "Al Majma'ah", 25.9039, 45.3456, 3),
    ("الزلفي", "Az Zulfi", 26.2994, 44.8155, 3),
    ("شقراء", "Shaqra", 25.2484, 45.2512, 3),
    ("عفيف", "Afif", 23.9065, 42.9172, 3),
    ("القنفذة", "Al Qunfudhah", 19.1264, 41.0789, 3),
    ("رابغ", "Rabigh", 22.7986, 39.0349, 3),
]


def fetch():
    print(f"Downloading {NE_URL}")
    with urllib.request.urlopen(NE_URL) as r:
        data = json.load(r)
    feats = [f for f in data["features"] if f["properties"].get("adm0_a3") == "SAU"]
    SRC.parent.mkdir(parents=True, exist_ok=True)
    with open(SRC, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": feats}, f, ensure_ascii=False)
    print(f"Saved {len(feats)} Saudi features to {SRC}")


def to_latlng_rings(geom):
    """Shapely (lng, lat) geometry -> list of polygons, each a list of rings of [lat, lng]."""
    polys = [geom] if geom.geom_type == "Polygon" else list(geom.geoms)
    out = []
    for p in polys:
        rings = [p.exterior] + list(p.interiors)
        out.append([[[round(y, 4), round(x, 4)] for x, y in r.coords] for r in rings])
    return out


def main():
    if "--fetch" in sys.argv or not SRC.exists():
        fetch()
    data = json.load(open(SRC, encoding="utf-8"))

    provinces = []
    for f in data["features"]:
        iso = f["properties"]["iso_3166_2"]
        if iso not in PROVINCES:
            print(f"warning: unknown province {iso}")
            continue
        ar, en, cap_ar, cap_en = PROVINCES[iso]
        geom = shape(f["geometry"])
        # Area in km² using a rough equal-area scale for these latitudes.
        import math
        lat0 = geom.centroid.y
        area = transform(lambda x, y: (x * 111.32 * math.cos(math.radians(lat0)), y * 110.57), geom).area
        simple = geom.simplify(0.01, preserve_topology=True)
        label = geom.representative_point()
        provinces.append({
            "iso": iso, "ar": ar, "en": en, "capital_ar": cap_ar, "capital_en": cap_en,
            "area_km2": round(area / 1000) * 1000,
            "label": [round(label.y, 3), round(label.x, 3)],
            "poly": to_latlng_rings(simple),
        })
    provinces.sort(key=lambda p: p["iso"])

    cities = [{"ar": a, "en": e, "lat": la, "lng": ln, "rank": r} for a, e, la, ln, r in CITIES]

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({
            "source": "Natural Earth (public domain) admin-1 and populated places",
            "provinces": provinces, "cities": cities,
        }, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{len(provinces)} provinces, {len(cities)} cities -> {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
