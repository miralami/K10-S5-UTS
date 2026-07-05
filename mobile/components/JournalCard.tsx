import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { JournalNote } from "../types";
import { formatDate } from "../utils/date";
import { theme } from "../constants/theme";

interface Props {
  note: JournalNote;
  onPress: (note: JournalNote) => void;
}

export default function JournalCard({ note, onPress }: Props) {
  const bodyPreview = note.body
    ? note.body.length > 80
      ? note.body.slice(0, 80) + "…"
      : note.body
    : "";

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(note)}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {note.title || "Untitled"}
        </Text>
        <Text style={styles.date}>{formatDate(note.noteDate)}</Text>
      </View>
      {bodyPreview ? (
        <Text style={styles.body} numberOfLines={2}>
          {bodyPreview}
        </Text>
      ) : null}
      {note.gratitudeCount > 0 && (
        <View style={styles.gratitudeBadge}>
          <Text style={styles.gratitudeText}>
            🙏 {note.gratitudeCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontFamily: theme.fonts.title, color: theme.colors.primary, fontSize: 18, flex: 1, marginRight: 8 },
  date: { fontFamily: theme.fonts.bodyItalic, color: theme.colors.textMuted, fontSize: 13 },
  body: { fontFamily: theme.fonts.body, color: theme.colors.text, fontSize: 15, lineHeight: 22, marginTop: 4 },
  gratitudeBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  gratitudeText: { fontFamily: theme.fonts.bodyBold, color: theme.colors.success, fontSize: 13 },
});
