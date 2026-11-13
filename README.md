# خريطة الرياض البرية · Riyadh Wild Map

An interactive, searchable map of **5,800+ desert locations around Riyadh**: mountains, valleys, wells, sand dunes, heritage sites, desert tracks and more. The data comes from the public Google My Maps
[خريطة الرياض البرية](https://www.google.com/maps/d/viewer?mid=1zDvUx5fza1RvGTDpoDrx2YeMRrmvbNKe).

## Features

- Full-screen map with satellite, streets and terrain base maps, plus marker clustering
- Arabic-aware search that ignores diacritics and treats أ/إ/آ/ا, ة/ه, ى/ي and ء alike, and matches with or without "ال"
- Paste coordinates (`24.71, 46.67`) into the search box to jump to a point
- Category filters with live counts (double-click a chip to show only that category)
- Browsable result list: sort by best match, nearest or A–Z, and optionally limit it to the visible map area
- Place details: nearest town, distance from you, Google Maps directions, copy coordinates, share link (`#p123`)
- Desert tracks and boundaries drawn as lines; tracks are searchable and show their length
- "My location" button, optional place-name labels on the map
- Arabic / English UI; mobile layout with a bottom sheet

## Run locally

It is a static site, so any web server works:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Update the data

```bash
python3 scripts/build_data.py --fetch   # re-download the KML from Google My Maps and rebuild data/*.json
python3 scripts/build_data.py           # rebuild from data/source/riyadh-wild-map.kml
```

## Deploy

`.github/workflows/pages.yml` publishes the site to GitHub Pages on every push to `main`.
Enable it once under **Settings → Pages → Source: GitHub Actions**.

## Layout

| Path | What |
| --- | --- |
| `index.html`, `css/`, `js/app.js` | The website (Leaflet + Leaflet.markercluster, no build step) |
| `data/places.json` | Points: `[name, categoryIndex, lat, lng, nearestTown, nearestTownKm, description]` |
| `data/lines.json` | Lines: `[name, categoryIndex, [[lat, lng], …]]` |
| `data/source/riyadh-wild-map.kml` | Original KML export |
| `scripts/build_data.py` | KML → JSON converter |

Map data credit: الخرائط البرية (@maps_ksa).
