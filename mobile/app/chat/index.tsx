import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";

export default function ChatScreen() {
  const user = useAuthStore((s) => s.user);
  const { messages, users, typingUsers, isConnected, connect, disconnect, send, sendTyping } = useChatStore();
  const router = useRouter();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (user) {
      connect("", String(user.id), user.name);
      // token is injected by the api interceptor, but chat needs raw token
      // Re-connect with actual token on mount
      import("../../utils/storage").then(({ getToken }) =>
        getToken().then((t) => {
          if (t) connect(t, String(user.id), user.name);
        })
      );
    }
    return () => disconnect();
  }, [user]);

  const handleSend = () => {
    if (!input.trim()) return;
    send(input.trim());
    setInput("");
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: `Chat ${isConnected ? "●" : "○"}`,
          headerShown: true,
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* Online users */}
          <View style={styles.usersBar}>
            <Text style={styles.usersLabel}>
              Online ({users.filter((u) => u.isOnline).length}):
            </Text>
            <Text style={styles.usersList} numberOfLines={1}>
              {users
                .filter((u) => u.isOnline)
                .map((u) => u.name)
                .join(", ") || "none"}
            </Text>
          </View>

          {typingUsers.length > 0 && (
            <Text style={styles.typing}>
              {typingUsers.join(", ")} typing...
            </Text>
          )}

          {/* Messages */}
          <FlatList
            data={messages}
            keyExtractor={(m) => m.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.msgBubble,
                  item.sender.name === user?.name
                    ? styles.msgOwn
                    : styles.msgOther,
                ]}
              >
                <Text
                  style={[
                    styles.msgSender,
                    item.sender.name === user?.name && styles.msgSenderOwn,
                  ]}
                >
                  {item.sender.name}
                </Text>
                <Text
                  style={[
                    styles.msgText,
                    item.sender.name === user?.name && styles.msgTextOwn,
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {!isConnected
                  ? "Connecting..."
                  : "No messages yet. Say hello!"}
              </Text>
            }
          />

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={(t) => {
                setInput(t);
                sendTyping(t.length > 0);
              }}
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },
  usersBar: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  usersLabel: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  usersList: { fontSize: 12, color: "#374151", flex: 1, marginLeft: 4 },
  typing: { fontSize: 12, color: "#2563eb", paddingHorizontal: 12, paddingVertical: 4, fontStyle: "italic" },
  list: { flex: 1 },
  listContent: { padding: 12 },
  msgBubble: { maxWidth: "80%", marginBottom: 8, borderRadius: 12, padding: 10 },
  msgOwn: {
    backgroundColor: "#2563eb",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  msgOther: {
    backgroundColor: "#f3f4f6",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  msgSender: { fontSize: 11, fontWeight: "600", marginBottom: 2, color: "#6b7280" },
  msgSenderOwn: { color: "#93c5fd" },
  msgText: { fontSize: 15, color: "#374151" },
  msgTextOwn: { color: "#fff" },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
  inputRow: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#2563eb",
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  sendText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
