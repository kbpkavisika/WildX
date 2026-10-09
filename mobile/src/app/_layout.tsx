import "@/lib/tracking/task";
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold, useFonts } from "@expo-google-fonts/geist";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useSession } from "@/lib/auth/store";
import { QUERY_CACHE_MAX_AGE_MS } from "@/lib/constants";
import { ROLES } from "@/lib/enums";
import { queryClient, queryPersister } from "@/lib/query-client";
import { colors } from "@/lib/theme";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold });
  const hydrated = useSession((state) => state.hydrated);
  const signedIn = useSession((state) => state.token !== null && state.user?.role === ROLES.RANGER);
  const ready = (fontsLoaded || fontError !== null) && hydrated;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: queryPersister, maxAge: QUERY_CACHE_MAX_AGE_MS }}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="login" />
          </Stack.Protected>
          <Stack.Protected guard={signedIn}>
            <Stack.Screen name="(ranger)" />
          </Stack.Protected>
        </Stack>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
