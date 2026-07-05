import { useEffect } from "react";
import { Stack } from "expo-router";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuthStore } from "../store/authStore";
import { theme } from "../constants/theme";
import { 
  useFonts as usePlayfair, 
  PlayfairDisplay_400Regular, 
  PlayfairDisplay_700Bold 
} from '@expo-google-fonts/playfair-display';
import { 
  useFonts as useCrimson, 
  CrimsonText_400Regular, 
  CrimsonText_400Regular_Italic, 
  CrimsonText_700Bold 
} from '@expo-google-fonts/crimson-text';
import { RootSiblingParent } from 'react-native-root-siblings';

export default function RootLayout() {
  const { isLoading, initialize } = useAuthStore();
  const [playfairLoaded] = usePlayfair({ PlayfairDisplay_400Regular, PlayfairDisplay_700Bold });
  const [crimsonLoaded] = useCrimson({ CrimsonText_400Regular, CrimsonText_400Regular_Italic, CrimsonText_700Bold });

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading || !playfairLoaded || !crimsonLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <RootSiblingParent>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="journal/new" options={{ presentation: "modal" }} />
        <Stack.Screen name="journal/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="journal/[id]/edit" options={{ presentation: "modal" }} />
        <Stack.Screen name="movies/index" options={{ presentation: "modal" }} />
        <Stack.Screen name="chat/index" options={{ presentation: "modal" }} />
      </Stack>
    </RootSiblingParent>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
});
