import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-root-toast';
import { JournalNote } from "../../types";
import * as journalService from "../../services/journal";
import { formatDate, daysSince } from "../../utils/date";
import RemoteImage from "../../components/RemoteImage";
import { theme } from "../../constants/theme";

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<JournalNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    journalService
      .get(Number(id))
      .then(setNote)
      .catch((e: any) => setError(e?.message ?? "Failed to load entry"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    Alert.alert("Delete entry", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await journalService.remove(Number(id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show("Entry deleted.", { duration: Toast.durations.SHORT });
            router.back();
          } catch {
            Alert.alert("Error", "Failed to delete entry");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !note) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? "Entry not found"}</Text>
      </View>
    );
  }

  const age = daysSince(note.noteDate);
  const canEdit = age <= 3;

  return (
    <>
      <Stack.Screen
        options={{
          title: note.title || "Journal Entry",
          headerShown: true,
        }}
      />
      <ScrollView style={styles.container}>
        {note.title ? (
          <Text style={styles.title}>{note.title}</Text>
        ) : null}
        <Text style={styles.date}>{formatDate(note.noteDate)}</Text>

        {note.body ? <Text style={styles.body}>{note.body}</Text> : null}

        {note.imageUrl && (
          <RemoteImage
            imageUrl={note.imageUrl}
            style={styles.image}
          />
        )}

        {note.gratitudeCount > 0 && (
          <View style={styles.gratitudes}>
            <Text style={styles.sectionTitle}>Gratitudes</Text>
            {[note.gratitude1, note.gratitude2, note.gratitude3]
              .filter(Boolean)
              .map((g, i) => (
                <Text key={i} style={styles.gratitudeItem}>
                  • {g}
                </Text>
              ))}
          </View>
        )}

        <View style={styles.actions}>
          {canEdit ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/journal/${id}/edit`)}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.restriction}>
              This entry can no longer be edited (older than 3 days).
            </Text>
          )}

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 24 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  title: { fontSize: 24, fontFamily: theme.fonts.title, color: theme.colors.primary, marginBottom: 4 },
  date: { fontSize: 16, fontFamily: theme.fonts.bodyItalic, color: theme.colors.textMuted, marginBottom: 16 },
  body: { fontSize: 18, lineHeight: 28, fontFamily: theme.fonts.body, color: theme.colors.text, marginBottom: 16 },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  gratitudes: {
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 0,
    paddingVertical: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.titleRegular,
    marginBottom: 8,
    color: theme.colors.primary,
  },
  gratitudeItem: { fontSize: 15, fontFamily: theme.fonts.body, color: theme.colors.text, marginBottom: 4 },
  actions: { marginTop: 8, gap: 12, marginBottom: 40 },
  editButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
    padding: 14,
    alignItems: "center",
  },
  editText: { color: "#fff", fontSize: 16, fontFamily: theme.fonts.bodyBold },
  restriction: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontStyle: "italic",
    textAlign: "center",
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: 4,
    padding: 14,
    alignItems: "center",
  },
  deleteText: { color: theme.colors.danger, fontSize: 16, fontFamily: theme.fonts.bodyBold },
  errorText: { color: theme.colors.danger },
});
