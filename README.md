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
- "My location" button with a distinct marker (dark disc, magenta pulse) and accuracy circle that follows you
- **Weather** for any place (Open-Meteo, free and open source, no API key): now, 7-day forecast, past rain, and warnings for rain, strong wind/dust, cold nights and extreme heat
- **Water status estimate** for valleys, rawdas, khabras and basins: samples terrain height around the spot to find the higher ground that drains into it, combines modelled rain on the site and on that catchment over 3/7/30 days, and warns about flash floods when rain is forecast upstream
- **Free water points (ماء سبيل)**: 1,101 drinking-water points from the public Google Maps list “مارد ماء”, with their notes (salinity, opening hours) and the date each was added
- **Regions and major cities**: all 13 administrative regions (boundaries, capital, area, how many places of this map fall inside) and 41 major cities
- **Nature reserves**: 8 royal reserves and 10 National Center for Wildlife protected areas with boundaries, what is allowed / not allowed, permit requirements and official links; any place inside a reserve shows a notice
- Optional place-name labels on the map
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

Regions and cities (`scripts/build_regions.py`, needs `pip install shapely`):

```bash
python3 scripts/build_regions.py          # from data/source/ne_sau_admin1.geojson
python3 scripts/build_regions.py --fetch  # re-download Natural Earth first
```

Free water points (`scripts/build_sabil.py`; only names, notes, positions and dates are kept):

```bash
python3 scripts/build_sabil.py --fetch   # re-download the Google Maps list and rebuild data/sabil.json
```

Reserves (`scripts/build_reserves.py`): rules, permits and links live in `data/source/reserves_research.json`
(collected from the reserve authorities, the National Center for Wildlife, SPA and news; each record lists
its sources and whether they are official). Boundaries come from OpenStreetMap via Nominatim.

```bash
python3 scripts/build_reserves.py           # from the saved sources
python3 scripts/build_reserves.py --fetch   # re-query OpenStreetMap boundaries first
```

Three reserves (Imam Faisal bin Turki, Majami' al-Hadb, Jubail marine) have no verified open location yet,
so they are listed with their rules but not drawn on the map.

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
| `data/regions.json` | 13 regions (simplified polygons) and major cities |
| `data/sabil.json` | Free water points: `[name, note, lat, lng, nearestTown, km, dateAdded]` |
| `data/reserves.json` | Reserves: boundaries, rules, permits, sources |
| `scripts/build_data.py` | KML → JSON converter |
| `scripts/build_regions.py`, `scripts/build_reserves.py` | Regions/cities and reserves builders |

Credits: map data الخرائط البرية (@maps_ksa); water points from the public Google Maps list [مارد ماء](https://www.google.com/maps/placelists/list/AS-mmlsXDV7Ch40OTImdd2zThu84GQ); regions and cities © Natural Earth (public domain);
reserve boundaries © OpenStreetMap contributors (ODbL); weather and elevation © Open-Meteo (CC BY 4.0).

The water status is an automatic estimate from modelled rainfall and terrain, not a field observation.
Reserve rules change; always confirm with the official authority before you visit.
