import { create } from "zustand";
import { DEVICE_FILTERS, type DeviceFilter } from "./types";

export type DevicesForm = "device" | "animal";

interface DevicesPageState {
  filter: DeviceFilter;
  form: DevicesForm | null;
  setFilter: (filter: DeviceFilter) => void;
  setForm: (form: DevicesForm | null) => void;
}

export const useDevicesPage = create<DevicesPageState>()((set) => ({
  filter: DEVICE_FILTERS.ALL,
  form: null,
  setFilter: (filter) => set({ filter }),
  setForm: (form) => set({ form }),
}));
