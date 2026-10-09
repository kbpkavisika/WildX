import { toTrendView } from "@/lib/reports/mappers";
import { useTrendUnit } from "@/lib/reports/store";
import type { DayCount, TrendUnit } from "@/lib/reports/types";

export function useTrend(days: DayCount[], units: readonly TrendUnit[]) {
  const stored = useTrendUnit((state) => state.unit);
  const setUnit = useTrendUnit((state) => state.setUnit);
  const unit = units.includes(stored) ? stored : units[0];
  return { unit, setUnit, view: toTrendView(days, unit) };
}
