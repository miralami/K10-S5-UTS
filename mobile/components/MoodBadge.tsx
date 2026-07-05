import { View, Text, StyleSheet } from "react-native";

const moodBg: Record<string, string> = {
  Happy: "#dcfce7",
  Sad: "#dbeafe",
  Angry: "#fee2e2",
  Anxious: "#f3e8ff",
  Neutral: "#f3f4f6",
  Excited: "#ffedd5",
  Calm: "#cffafe",
  Grateful: "#fef9c3",
};

const moodText: Record<string, string> = {
  Happy: "#166534",
  Sad: "#1e40af",
  Angry: "#991b1b",
  Anxious: "#6b21a8",
  Neutral: "#374151",
  Excited: "#9a3412",
  Calm: "#155e75",
  Grateful: "#854d0e",
};

interface Props {
  mood: string;
}

export default function MoodBadge({ mood }: Props) {
  let bg = "#f3f4f6";
  let fg = "#374151";
  for (const [key] of Object.entries(moodBg)) {
    if (mood.toLowerCase().includes(key.toLowerCase())) {
      bg = moodBg[key];
      fg = moodText[key];
      break;
    }
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{mood}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: { fontSize: 13, fontWeight: "600" },
});
