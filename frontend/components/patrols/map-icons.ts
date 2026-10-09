import { divIcon } from "leaflet";
import { TRACK_STYLES } from "./track-styles";

const TEAM_ICON_PX = 36;
const INCIDENT_ICON_PX = 22;

interface TeamIconOptions {
  number: number;
  colorIndex: number;
  selected: boolean;
  offline: boolean;
}

export function teamIcon({ number, colorIndex, selected, offline }: TeamIconOptions) {
  const style = TRACK_STYLES[colorIndex];
  const halo = selected ? `<span class="absolute inset-0 rounded-full ${style.halo}"></span>` : "";
  const ring = offline ? `<span class="absolute size-7 rounded-full border-[1.5px] border-dashed border-negative"></span>` : "";
  return divIcon({
    className: "",
    iconSize: [TEAM_ICON_PX, TEAM_ICON_PX],
    iconAnchor: [TEAM_ICON_PX / 2, TEAM_ICON_PX / 2],
    html: `<span class="relative flex size-9 items-center justify-center font-sans">${halo}${ring}<span class="relative flex size-[23px] items-center justify-center rounded-full border-[3px] border-white text-[11px] font-semibold text-white ${style.fill}">${number}</span></span>`,
  });
}

export const incidentIcon = divIcon({
  className: "",
  iconSize: [INCIDENT_ICON_PX, INCIDENT_ICON_PX],
  iconAnchor: [INCIDENT_ICON_PX / 2, INCIDENT_ICON_PX / 2],
  html: `<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M11 2L22 20H0Z" class="fill-negative"/><path d="M11 8v5M11 16v.5" stroke="white" stroke-width="1.6" stroke-linecap="round"/></svg>`,
});

const WAYPOINT_ICON_PX = 18;

export const waypointIcon = divIcon({
  className: "",
  iconSize: [WAYPOINT_ICON_PX, WAYPOINT_ICON_PX],
  iconAnchor: [WAYPOINT_ICON_PX / 2, WAYPOINT_ICON_PX / 2],
  html: `<span class="flex size-[18px] items-center justify-center rounded-full border border-line bg-white shadow-float"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="stroke-primary"><path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/></svg></span>`,
});
