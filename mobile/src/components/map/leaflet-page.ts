import { BASE_TILE_URL, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_FIT_PADDING_PX, MAP_FOCUS_ZOOM, MAP_MAX_ZOOM } from "@/lib/constants";
import { colors } from "@/lib/theme";

const LEAFLET_URL = "https://unpkg.com/leaflet@1.9.4/dist";
const GEIST_URL = "https://fonts.googleapis.com/css2?family=Geist:wght@600&display=swap";
const TEAM_HALO = 36;
const TEAM_DOT = 23;
const TEAM_BORDER = 3;
const TEAM_LABEL_SIZE = 11;
const TEAM_Z_INDEX = 1000;
const INCIDENT_SIZE = 22;
const WAYPOINT_SIZE = 18;
const WAYPOINT_ICON = 10;
const WAYPOINT_STROKE = 2.4;
const HALO_ALPHA = "33";
const SECTOR_DASH = "6 5";
const SECTOR_STROKE = 1.5;
const LINE_DASH = "8 8";

const INCIDENT_SVG = `<svg width="${INCIDENT_SIZE}" height="${INCIDENT_SIZE}" viewBox="0 0 22 22"><path d="M11 2L22 20H0Z" fill="${colors.negative}"/><path d="M11 8v5M11 16v.5" stroke="${colors.onPrimary}" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const FLAG_SVG = `<svg width="${WAYPOINT_ICON}" height="${WAYPOINT_ICON}" viewBox="0 0 24 24" fill="none" stroke="${colors.primary}" stroke-width="${WAYPOINT_STROKE}" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`;

const STYLE = `
html, body, #map { margin: 0; height: 100%; background: ${colors.mapGround}; }
.leaflet-container { background: ${colors.mapGround}; }
.wx-icon { background: none; border: none; }
.wx-center { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.wx-halo { width: ${TEAM_HALO}px; height: ${TEAM_HALO}px; border-radius: 50%; background: ${colors.track1}${HALO_ALPHA}; }
.wx-team { box-sizing: border-box; width: ${TEAM_DOT}px; height: ${TEAM_DOT}px; border-radius: 50%; border: ${TEAM_BORDER}px solid ${colors.onPrimary}; background: ${colors.track1}; color: ${colors.onPrimary}; font: 600 ${TEAM_LABEL_SIZE}px/1 Geist, sans-serif; }
.wx-waypoint { box-sizing: border-box; width: ${WAYPOINT_SIZE}px; height: ${WAYPOINT_SIZE}px; border-radius: 50%; border: 1px solid ${colors.line}; background: ${colors.surface}; }
`;

const SCRIPT = `
const map = L.map("map", { zoomControl: false, attributionControl: false, maxZoom: ${MAP_MAX_ZOOM} }).setView(${JSON.stringify(MAP_DEFAULT_CENTER)}, ${MAP_DEFAULT_ZOOM});
L.tileLayer("${BASE_TILE_URL}", { maxZoom: ${MAP_MAX_ZOOM} }).addTo(map);
const layer = L.layerGroup().addTo(map);
let pickable = false;
map.on("click", (event) => {
  if (pickable) window.ReactNativeWebView.postMessage(JSON.stringify([event.latlng.lat, event.latlng.lng]));
});
function icon(size, html) {
  return L.divIcon({ className: "wx-icon", iconSize: [size, size], iconAnchor: [size / 2, size / 2], html: '<div class="wx-center">' + html + "</div>" });
}
function teamIcon(text) {
  const label = document.createElement("div");
  label.className = "wx-team wx-center";
  label.textContent = text;
  return icon(${TEAM_HALO}, '<div class="wx-halo wx-center">' + label.outerHTML + "</div>");
}
const ICONS = {
  team: (marker) => teamIcon(marker.text ?? ""),
  incident: () => icon(${INCIDENT_SIZE}, '${INCIDENT_SVG}'),
  waypoint: () => icon(${WAYPOINT_SIZE}, '<div class="wx-waypoint wx-center">${FLAG_SVG}</div>'),
};
function popup(text) {
  const content = document.createElement("span");
  content.textContent = text;
  return content;
}
window.wildx = {
  render(scene) {
    layer.clearLayers();
    pickable = scene.pickable;
    scene.sectors.forEach((rings) => L.polygon(rings, { color: "${colors.primary}", weight: ${SECTOR_STROKE}, dashArray: "${SECTOR_DASH}", fillColor: "${colors.mapLandFill}", fillOpacity: 1, interactive: false }).addTo(layer));
    scene.lines.forEach((line) => L.polyline(line.points, { color: line.color, weight: line.width, dashArray: line.dashed ? "${LINE_DASH}" : null, lineCap: "round", lineJoin: "round", interactive: false }).addTo(layer));
    scene.markers.forEach((marker) => L.marker(marker.position, { icon: ICONS[marker.kind](marker), title: marker.label, alt: marker.label, zIndexOffset: marker.kind === "team" ? ${TEAM_Z_INDEX} : 0 }).bindPopup(popup(marker.label)).addTo(layer));
  },
  fit(points) {
    if (points.length > 0) map.fitBounds(points, { padding: [${MAP_FIT_PADDING_PX}, ${MAP_FIT_PADDING_PX}] });
  },
  focus(point) {
    map.setView(point, Math.max(map.getZoom(), ${MAP_FOCUS_ZOOM}));
  },
};
`;

export const LEAFLET_PAGE = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="${LEAFLET_URL}/leaflet.css">
<link rel="stylesheet" href="${GEIST_URL}">
<style>${STYLE}</style>
<script src="${LEAFLET_URL}/leaflet.js"></script>
</head>
<body>
<div id="map"></div>
<script>${SCRIPT}</script>
</body>
</html>`;
