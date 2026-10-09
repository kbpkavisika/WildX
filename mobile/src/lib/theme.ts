import type { TextStyle, ViewStyle } from "react-native";

export const colors = {
  primary: "#1F4D43",
  primaryHover: "#173B33",
  onPrimary: "#FFFFFF",
  secondary: "#D5EE9B",
  secondarySoft: "#E9F1DA",
  tertiary: "#FF7A59",
  tertiaryDeep: "#E8603F",
  surface: "#FFFFFF",
  surfaceMuted: "#F6F6F3",
  surfaceSunken: "#F2F1EE",
  surfaceForm: "#F7F8F4",
  line: "#E4E7E0",
  lineStrong: "#DADDD4",
  lineSoft: "#F0F1EC",
  ink: "#16201B",
  inkBody: "#3B433E",
  inkMuted: "#6B726C",
  inkFaint: "#9AA19B",
  positive: "#2F7A2E",
  positiveBg: "#E8F6E6",
  positiveLine: "#BFE3B9",
  negative: "#B42E22",
  negativeBg: "#FDECEA",
  negativeLine: "#F3C1BA",
  responding: "#C2410C",
  online: "#3DBE6B",
  mapLand: "#E6EED9",
  mapGround: "#F4F6EF",
  track1: "#1F4D43",
  track2: "#E8603F",
  track3: "#6A4FB6",
  track4: "#A87A00",
  backdrop: "rgba(22, 32, 27, 0.4)",
  mapLandFill: "rgba(230, 238, 217, 0.35)",
} as const;

export const radii = { xs: 6, sm: 8, field: 10, md: 12, lg: 14, xl: 18, full: 9999 } as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28 } as const;

export const sizes = { tap: 48, control: 40, quiet: 32, icon: 20, buttonIcon: 18, smallIcon: 14 } as const;

export const ICON_STROKE = 1.8;

export const fonts = {
  regular: "Geist_400Regular",
  medium: "Geist_500Medium",
  semibold: "Geist_600SemiBold",
  bold: "Geist_700Bold",
} as const;

export const type = {
  pageTitle: { fontFamily: fonts.semibold, fontSize: 32, lineHeight: 38, letterSpacing: -0.64 },
  wordmark: { fontFamily: fonts.semibold, fontSize: 23, lineHeight: 28, letterSpacing: -0.69 },
  cardTitle: { fontFamily: fonts.medium, fontSize: 20, lineHeight: 28 },
  formTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24 },
  nav: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  fieldLabel: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

export const floatingShadow: ViewStyle = {
  shadowColor: colors.ink,
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
};
