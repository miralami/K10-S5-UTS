import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  month: number;
  year: number;
  markedDays: Set<string>; // "YYYY-MM-DD"
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function daysInMonth(m: number, y: number): number {
  return new Date(y, m, 0).getDate();
}

function firstDayOfMonth(m: number, y: number): number {
  return new Date(y, m - 1, 1).getDay();
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function CalendarGrid({
  month,
  year,
  markedDays,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const totalDays = daysInMonth(month, year);
  const startDay = firstDayOfMonth(month, year);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  return (
    <View style={styles.container}>
      {/* Month/Year navigation */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navButton}>
          <Text style={styles.navArrow}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>
          {monthNames[month - 1]} {year}
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navButton}>
          <Text style={styles.navArrow}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Day names header */}
      <View style={styles.weekRow}>
        {DAY_NAMES.map((d) => (
          <View key={d} style={styles.weekCell}>
            <Text style={styles.weekText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          const dateStr = day
            ? `${year}-${pad(month)}-${pad(day)}`
            : null;
          const hasEntry = dateStr ? markedDays.has(dateStr) : false;
          const isSelected = dateStr === selectedDate;

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayCell,
                isSelected && styles.daySelected,
              ]}
              onPress={() => dateStr && onSelectDate(dateStr)}
              disabled={!day}
            >
              {day ? (
                <>
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                  {hasEntry && (
                    <View
                      style={[
                        styles.dot,
                        isSelected && styles.dotSelected,
                      ]}
                    />
                  )}
                </>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", borderRadius: 12, padding: 12 },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  navButton: { padding: 8 },
  navArrow: { fontSize: 16, color: "#2563eb" },
  navTitle: { fontSize: 16, fontWeight: "600" },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekCell: { flex: 1, alignItems: "center", paddingVertical: 4 },
  weekText: { fontSize: 12, color: "#9ca3af", fontWeight: "500" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  daySelected: {
    backgroundColor: "#2563eb",
  },
  dayText: { fontSize: 14, color: "#374151" },
  dayTextSelected: { color: "#fff", fontWeight: "600" },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#2563eb",
    marginTop: 2,
  },
  dotSelected: { backgroundColor: "#fff" },
});
