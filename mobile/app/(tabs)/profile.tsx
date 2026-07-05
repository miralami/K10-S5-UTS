import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuthStore } from "../../store/authStore";

import { theme } from "../../constants/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(user?.name ?? "U").charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.name}>{user?.name ?? "User"}</Text>
      <Text style={styles.email}>{user?.email ?? ""}</Text>

      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => router.push("/chat")}
      >
        <Text style={styles.chatButtonText}>💬 Open Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>
        Mood Journal v{Constants.expoConfig?.version ?? "1.0.0"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    paddingTop: 48,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: { fontSize: 28, fontFamily: theme.fonts.title, color: theme.colors.surface },
  name: { fontSize: 26, fontFamily: theme.fonts.title, color: theme.colors.primary },
  email: { fontSize: 16, fontFamily: theme.fonts.bodyItalic, color: theme.colors.textMuted, marginTop: 4, marginBottom: 48 },
  chatButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 4,
    padding: 14,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  chatButtonText: { color: theme.colors.primary, fontFamily: theme.fonts.bodyBold, fontSize: 15 },
  logoutButton: {
    backgroundColor: theme.colors.danger,
    borderRadius: 4,
    padding: 14,
    alignItems: "center",
    width: "100%",
  },
  logoutText: { color: theme.colors.surface, fontSize: 16, fontFamily: theme.fonts.bodyBold },
  version: {
    fontSize: 13,
    fontFamily: theme.fonts.body,
    color: theme.colors.textMuted,
    position: "absolute",
    bottom: 32,
  },
});
