import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "WildX Ranger",
  slug: "wildx-ranger",
  scheme: "wildx",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  backgroundColor: "#FFFFFF",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "lk.wildx.ranger",
  },
  android: {
    package: "lk.wildx.ranger",
    adaptiveIcon: {
      backgroundColor: "#1F4D43",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  experiments: {
    typedRoutes: true,
  },
  plugins: [
    "expo-router",
    "expo-status-bar",
    "expo-sqlite",
    "expo-secure-store",
    "expo-font",
    ["expo-splash-screen", { backgroundColor: "#FFFFFF", image: "./assets/splash-icon.png", imageWidth: 120 }],
    [
      "expo-location",
      {
        locationWhenInUsePermission: "WildX records your patrol track and incident locations.",
        locationAlwaysAndWhenInUsePermission: "WildX keeps recording your patrol track while the screen is locked.",
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    ["expo-image-picker", { cameraPermission: "WildX uses the camera to photograph incidents.", microphonePermission: false }],
  ],
};

export default config;
