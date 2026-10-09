import { create } from "zustand";
import { DEVICE_FILTERS, type DeviceFilter } from "./types";

interface DevicesPageState {
  filter: DeviceFilter;
  setFilter: (filter: DeviceFilter) => void;
}

export const useDevicesPage = create<DevicesPageState>()((set) => ({
  filter: DEVICE_FILTERS.ALL,
  setFilter: (filter) => set({ filter }),
}));
