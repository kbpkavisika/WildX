import { divIcon } from "leaflet";
import type { StatusTone } from "@/components/ui/status-dot";
import { ALERT_TONE_STYLES } from "./alert-tones";

const ALERT_ICON_PX = 36;

export function alertIcon(number: number, tone: StatusTone, selected: boolean) {
  const style = ALERT_TONE_STYLES[tone];
  const halo = selected ? `<span class="absolute inset-0 rounded-full ${style.halo}"></span>` : "";
  return divIcon({
    className: "",
    iconSize: [ALERT_ICON_PX, ALERT_ICON_PX],
    iconAnchor: [ALERT_ICON_PX / 2, ALERT_ICON_PX / 2],
    html: `<span class="relative flex size-9 items-center justify-center font-sans">${halo}<span class="relative flex size-[23px] items-center justify-center rounded-full border-[3px] border-white text-[11px] font-semibold text-white ${style.fill}">${number}</span></span>`,
  });
}
