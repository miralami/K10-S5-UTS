import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useJournals } from "../../hooks/useJournals";
import JournalCard from "../../components/JournalCard";
import Skeleton from "../../components/Skeleton";
import SearchBar from "../../components/SearchBar";
import { JournalNote } from "../../types";
import * as journalService from "../../services/journal";

import { theme } from "../../constants/theme";

export default function JournalListScreen() {
  const { notes, isLoading, error, fetch, refresh } = useJournals();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<JournalNote[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetch();
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    setSearching(true);
    try {
      const results = await journalService.search(q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery(null);
    setSearchResults([]);
  }, []);

  const displayNotes = searchQuery !== null ? searchResults : notes;
  const isLoadingList = isLoading || searching;

  const handlePress = (note: JournalNote) => {
    router.push(`/journal/${note.id}`);
  };

  if (isLoadingList && displayNotes.length === 0 && !searchQuery) {
    return (
      <View style={styles.container}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.skeletonCard}>
            <View style={styles.skeletonHeader}>
              <Skeleton width="60%" height={18} />
              <Skeleton width="30%" height={14} />
            </View>
            <View style={{ marginTop: 8 }}>
              <Skeleton height={14} width="90%" />
            </View>
            <View style={{ marginTop: 6 }}>
              <Skeleton height={14} width="40%" borderRadius={12} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (error && !searchQuery) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetch} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />

      {searchQuery && searching && (
        <ActivityIndicator style={{ padding: 8 }} size="small" />
      )}

      <FlatList
        data={displayNotes}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <JournalCard note={item} onPress={handlePress} />
        )}
        refreshControl={
          searchQuery ? undefined : (
            <RefreshControl refreshing={isLoading} onRefresh={refresh} />
          )
        }
        contentContainerStyle={
          displayNotes.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {searchQuery
                ? "No results found"
                : "No entries yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Try different keywords."
                : "Tap + to write your first journal entry."}
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/journal/new")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  list: { paddingBottom: 8 },
  emptyContainer: { flexGrow: 1, justifyContent: "center" },
  empty: { alignItems: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontFamily: theme.fonts.title, color: theme.colors.primary },
  emptySubtitle: { fontSize: 14, fontFamily: theme.fonts.bodyItalic, color: theme.colors.textMuted, marginTop: 4 },
  errorText: { color: "#dc2626", marginBottom: 12 },
  retryButton: { padding: 8 },
  retryText: { color: theme.colors.primary, fontWeight: "600" },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  fabText: { fontSize: 28, fontFamily: theme.fonts.title, color: theme.colors.surface, lineHeight: 30 },
  skeletonCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  skeletonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
