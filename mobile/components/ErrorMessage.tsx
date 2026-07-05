import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export default function ErrorMessage({
  message,
  onDismiss,
  onRetry,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.text}>{message}</Text>
        {onDismiss ? (
          <TouchableOpacity onPress={onDismiss} style={styles.dismiss}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  text: { color: "#dc2626", fontSize: 14, flex: 1 },
  dismiss: { padding: 4, marginLeft: 8 },
  dismissText: { fontSize: 16, color: "#9ca3af" },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#dc2626",
  },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
