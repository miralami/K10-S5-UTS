import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useMoodAnalysis } from "../../hooks/useMoodAnalysis";
import MoodSummaryCard, {
  MoodSummaryCardEmpty,
} from "../../components/MoodSummaryCard";
import JournalCard from "../../components/JournalCard";
import Skeleton from "../../components/Skeleton";
import { JournalNote } from "../../types";
import * as journalService from "../../services/journal";

import { theme } from "../../constants/theme";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { daily, weekly, loading: moodLoading, refresh: refreshMood } = useMoodAnalysis();
  const router = useRouter();
  const [recentNotes, setRecentNotes] = useState<JournalNote[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecent = useCallback(async () => {
    try {
      const data = await journalService.list();
      setRecentNotes(data.slice(0, 3));
    } catch {
      // silently fail — home screen still usable
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshMood(), fetchRecent()]);
    setRefreshing(false);
  }, [refreshMood, fetchRecent]);

  const weeklyMood = weekly?.analysis?.dominantMood ?? null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.greeting}>
        {greeting()}, {user?.name ?? "there"}
      </Text>

      <Text style={styles.sectionTitle}>Today's Mood</Text>
      {moodLoading ? (
        <View style={{ marginBottom: 16 }}>
          <Skeleton height={100} borderRadius={12} />
        </View>
      ) : daily ? (
        <MoodSummaryCard analysis={daily} />
      ) : (
        <MoodSummaryCardEmpty />
      )}

      {weeklyMood && (
        <>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weeklyCard}>
            <Text style={styles.weeklyMood}>
              Dominant mood:{" "}
              <Text style={styles.weeklyMoodValue}>{weeklyMood}</Text>
            </Text>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Recent Entries</Text>
      {recentNotes.length > 0 ? (
        recentNotes.map((note) => (
          <JournalCard
            key={note.id}
            note={note}
            onPress={(n) => router.push(`/journal/${n.id}`)}
          />
        ))
      ) : (
        <Text style={styles.emptyText}>
          No entries yet. Start writing below!
        </Text>
      )}

      <TouchableOpacity
        style={styles.writeButton}
        onPress={() => router.push("/journal/new")}
      >
        <Text style={styles.writeButtonText}>Write Today's Entry</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.moviesButton}
        onPress={() => router.push("/movies")}
      >
        <Text style={styles.moviesButtonText}>🎬 Movie Recommendations</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 24 },
  greeting: { fontSize: 28, fontFamily: theme.fonts.title, color: theme.colors.primary, marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.titleRegular,
    color: theme.colors.primary,
    marginBottom: 8,
    marginTop: 4,
  },
  weeklyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  weeklyMood: { fontSize: 15, fontFamily: theme.fonts.body, color: theme.colors.text },
  weeklyMoodValue: { fontFamily: theme.fonts.bodyBold, color: theme.colors.primary },
  emptyText: { fontSize: 14, fontFamily: theme.fonts.bodyItalic, color: theme.colors.textMuted, marginBottom: 16 },
  writeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  writeButtonText: { color: theme.colors.surface, fontSize: 16, fontFamily: theme.fonts.bodyBold },
  moviesButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 4,
    padding: 14,
    alignItems: "center",
    marginBottom: 32,
  },
  moviesButtonText: { color: theme.colors.primary, fontSize: 15, fontFamily: theme.fonts.bodyBold },
});
