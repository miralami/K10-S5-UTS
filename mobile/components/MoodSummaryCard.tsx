import { View, Text, StyleSheet } from "react-native";
import { DailyAnalysis } from "../types";
import { theme } from "../constants/theme";

interface Props {
  analysis: DailyAnalysis;
}

const moodColors: Record<string, string> = {
  Happy: theme.colors.success,
  Sad: theme.colors.textMuted,
  Angry: theme.colors.danger,
  Anxious: theme.colors.text,
  Neutral: "#A1A1AA",
  Excited: theme.colors.primary,
  Calm: "#0891b2",
  Grateful: "#78350F",
};

function getMoodColor(mood: string): string {
  for (const [key, color] of Object.entries(moodColors)) {
    if (mood.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "#6b7280";
}

export default function MoodSummaryCard({ analysis }: Props) {
  const color = getMoodColor(analysis.dominantMood);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.moodLabel}>Mood</Text>
        <Text style={[styles.moodValue, { color }]}>
          {analysis.dominantMood}
        </Text>
      </View>

      <View style={styles.scoreRow}>
        <View style={[styles.scoreBar, { backgroundColor: color + "30" }]}>
          <View
            style={[
              styles.scoreFill,
              { width: `${analysis.moodScore}%`, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={[styles.scoreText, { color }]}>{analysis.moodScore}</Text>
      </View>

      {analysis.affirmation ? (
        <Text style={styles.affirmation}>✨ {analysis.affirmation}</Text>
      ) : null}
    </View>
  );
}

export function MoodSummaryCardEmpty() {
  return (
    <View style={styles.card}>
      <Text style={styles.emptyText}>
        Write a journal entry to see your mood analysis.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  moodLabel: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.textMuted },
  moodValue: { fontFamily: theme.fonts.title, fontSize: 18 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  scoreBar: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    overflow: "hidden",
  },
  scoreFill: { height: "100%", borderRadius: 1 },
  scoreText: { fontFamily: theme.fonts.bodyBold, fontSize: 14, width: 30, textAlign: "right" },
  affirmation: { fontFamily: theme.fonts.bodyItalic, color: theme.colors.primary, fontSize: 14, marginTop: 4, lineHeight: 20 },
  emptyText: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.textMuted, textAlign: "center", padding: 8 },
});
