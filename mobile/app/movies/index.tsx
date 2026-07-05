import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import * as recommendationsService from "../../services/recommendations";

interface Movie {
  title: string;
  year: string;
  tagline: string;
  reason: string;
  poster_url: string | null;
}

export default function MovieRecommendationsScreen() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await recommendationsService.getRecommendations("happy");
      const items = res?.items ?? res ?? [];
      setMovies(Array.isArray(items) ? items : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  return (
    <>
      <Stack.Screen
        options={{ title: "Movie Recommendations", headerShown: true }}
      />
      <ScrollView style={styles.container}>
        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : movies.length > 0 ? (
          <View style={styles.grid}>
            {movies.map((m, i) => (
              <View key={i} style={styles.card}>
                {m.poster_url ? (
                  <Image
                    source={{ uri: m.poster_url }}
                    style={styles.poster}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.posterPlaceholder}>
                    <Text style={styles.posterPlaceholderText}>🎬</Text>
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.movieTitle}>{m.title}</Text>
                  {m.year ? (
                    <Text style={styles.movieYear}>{m.year}</Text>
                  ) : null}
                  {m.reason ? (
                    <Text style={styles.reason}>{m.reason}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : (
          !loading && (
            <Text style={styles.empty}>
              No recommendations available. Pull to refresh.
            </Text>
          )
        )}

        <TouchableOpacity style={styles.refreshButton} onPress={fetchMovies}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  error: {
    color: "#dc2626",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  grid: { gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  poster: { width: "100%", height: 180 },
  posterPlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  posterPlaceholderText: { fontSize: 40 },
  cardBody: { padding: 12 },
  movieTitle: { fontSize: 16, fontWeight: "600" },
  movieYear: { fontSize: 13, color: "#9ca3af", marginTop: 2 },
  reason: { fontSize: 14, color: "#6b7280", marginTop: 6, lineHeight: 20 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
  refreshButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  refreshText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
