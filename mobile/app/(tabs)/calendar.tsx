import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import CalendarGrid from "../../components/CalendarGrid";
import JournalCard from "../../components/JournalCard";
import { JournalNote } from "../../types";
import * as journalService from "../../services/journal";
import { todayISO } from "../../utils/date";

export default function CalendarScreen() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());

  const markedDays = new Set(
    notes.map((n) => n.noteDate.split("T")[0])
  );

  const selectedNotes = notes.filter(
    (n) => n.noteDate.split("T")[0] === selectedDate
  );

  useEffect(() => {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0);
    const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

    setLoading(true);
    journalService
      .list({ start_date: start, end_date: end })
      .then(setNotes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month, year]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Calendar", headerShown: true }} />
      <View style={styles.container}>
        <CalendarGrid
          month={month}
          year={year}
          markedDays={markedDays}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />

        <Text style={styles.sectionTitle}>
          {selectedDate === todayISO() ? "Today" : selectedDate}
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 12 }} />
        ) : selectedNotes.length > 0 ? (
          <FlatList
            data={selectedNotes}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <JournalCard
                note={item}
                onPress={(n) => router.push(`/journal/${n.id}`)}
              />
            )}
          />
        ) : (
          <Text style={styles.empty}>No entries for this date</Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  empty: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 24,
  },
});
