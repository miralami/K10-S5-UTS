import { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { theme } from "../constants/theme";

interface Props {
  onSearch: (query: string) => void;
  onClear: () => void;
}

export default function SearchBar({ onSearch, onClear }: Props) {
  const [value, setValue] = useState("");

  const handleChange = (text: string) => {
    setValue(text);
    if (text.trim().length >= 2) {
      onSearch(text.trim());
    } else if (text.trim().length === 0) {
      onClear();
    }
  };

  const handleClear = () => {
    setValue("");
    onClear();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        placeholder="Search journals..."
        placeholderTextColor="#9ca3af"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clear}>
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 4,
  },
  input: {
    flex: 1,
    padding: 10,
    paddingLeft: 14,
    fontSize: 15,
    fontFamily: theme.fonts.body,
    color: theme.colors.text,
  },
  clear: {
    padding: 8,
  },
  clearText: { 
    fontSize: 16, 
    color: theme.colors.textMuted,
  },
});
