import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-root-toast';
import * as journalService from "../../services/journal";
import { todayISO } from "../../utils/date";
import { theme } from "../../constants/theme";

export default function CreateJournalScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [noteDate, setNoteDate] = useState(todayISO());
  const [gratitude1, setGratitude1] = useState("");
  const [gratitude2, setGratitude2] = useState("");
  const [gratitude3, setGratitude3] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [checkingToday, setCheckingToday] = useState(true);

  useEffect(() => {
    const today = todayISO();
    journalService
      .list({ start_date: today, end_date: today })
      .then((notes) => {
        if (notes.length > 0) {
          // Today's note exists — redirect to edit instead
          router.replace(`/journal/${notes[0].id}/edit`);
        } else {
          setCheckingToday(false);
        }
      })
      .catch(() => setCheckingToday(false)); // on error, allow create
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload: any = {
        title: title || undefined,
        body: body || undefined,
        note_date: noteDate,
        gratitude_1: gratitude1 || undefined,
        gratitude_2: gratitude2 || undefined,
        gratitude_3: gratitude3 || undefined,
      };

      if (imageUri) {
        const form = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== undefined) form.append(k, v as string);
        });
        const filename = imageUri.split("/").pop() || "photo.jpg";
        form.append("image", {
          uri: imageUri,
          name: filename,
          type: "image/jpeg",
        } as any);
        await journalService.create(form);
      } else {
        await journalService.create(payload);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show("Entry saved.", { duration: Toast.durations.SHORT });
      router.back();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
        e?.message ??
        "Failed to create entry"
      );
      // Extract per-field validation errors (422 only)
      if (e?.response?.status === 422) {
        const errors = e?.response?.data?.errors;
        if (errors && typeof errors === "object") {
          const flat: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(errors)) {
            flat[key] = (msgs as string[])[0];
          }
          setFieldErrors(flat);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingToday) {
    return (
      <View style={styles.flex}>
        <ActivityIndicator style={{ flex: 1 }} size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "New Entry", headerShown: true }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.label}>Date</Text>
          <TextInput
            style={[styles.input, fieldErrors.note_date && styles.inputError]}
            value={noteDate}
            onChangeText={(v) => { setNoteDate(v); setFieldErrors((prev) => ({ ...prev, note_date: "" })); }}
            placeholder="YYYY-MM-DD"
            editable={!submitting}
          />
          {fieldErrors.note_date ? <Text style={styles.fieldError}>{fieldErrors.note_date}</Text> : null}

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={[styles.input, fieldErrors.title && styles.inputError]}
            value={title}
            onChangeText={(v) => { setTitle(v); setFieldErrors((prev) => ({ ...prev, title: "" })); }}
            placeholder="What's on your mind?"
            editable={!submitting}
          />
          {fieldErrors.title ? <Text style={styles.fieldError}>{fieldErrors.title}</Text> : null}

          <Text style={styles.label}>Body</Text>
          <TextInput
            style={[styles.input, styles.textArea, fieldErrors.body && styles.inputError]}
            value={body}
            onChangeText={(v) => { setBody(v); setFieldErrors((prev) => ({ ...prev, body: "" })); }}
            placeholder="Write your thoughts..."
            multiline
            numberOfLines={6}
            editable={!submitting}
          />
          {fieldErrors.body ? <Text style={styles.fieldError}>{fieldErrors.body}</Text> : null}

          <Text style={styles.sectionLabel}>Image</Text>
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          )}
          <TouchableOpacity
            style={styles.imageButton}
            onPress={pickImage}
            disabled={submitting}
          >
            <Text style={styles.imageButtonText}>
              {imageUri ? "Change Image" : "Add Image"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Gratitudes (optional)</Text>

          <TextInput
            style={[styles.input, fieldErrors.gratitude_1 && styles.inputError]}
            value={gratitude1}
            onChangeText={(v) => { setGratitude1(v); setFieldErrors((prev) => ({ ...prev, gratitude_1: "" })); }}
            placeholder="I'm grateful for..."
            editable={!submitting}
          />
          {fieldErrors.gratitude_1 ? <Text style={styles.fieldError}>{fieldErrors.gratitude_1}</Text> : null}
          <TextInput
            style={[styles.input, fieldErrors.gratitude_2 && styles.inputError]}
            value={gratitude2}
            onChangeText={(v) => { setGratitude2(v); setFieldErrors((prev) => ({ ...prev, gratitude_2: "" })); }}
            placeholder="I'm grateful for..."
            editable={!submitting}
          />
          {fieldErrors.gratitude_2 ? <Text style={styles.fieldError}>{fieldErrors.gratitude_2}</Text> : null}
          <TextInput
            style={[styles.input, fieldErrors.gratitude_3 && styles.inputError]}
            value={gratitude3}
            onChangeText={(v) => { setGratitude3(v); setFieldErrors((prev) => ({ ...prev, gratitude_3: "" })); }}
            placeholder="I'm grateful for..."
            editable={!submitting}
          />
          {fieldErrors.gratitude_3 ? <Text style={styles.fieldError}>{fieldErrors.gratitude_3}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Save Entry</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, padding: 24, backgroundColor: theme.colors.background },
  label: {
    fontSize: 16,
    fontFamily: theme.fonts.titleRegular,
    color: theme.colors.primary,
    marginBottom: 6,
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: theme.fonts.titleRegular,
    color: theme.colors.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  input: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 12,
    fontSize: 18,
    fontFamily: theme.fonts.body,
    color: theme.colors.text,
    marginBottom: 8,
  },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  inputError: {
    borderColor: theme.colors.danger,
  },
  fieldError: {
    color: theme.colors.danger,
    fontSize: 12,
    marginBottom: 4,
    marginTop: -4,
  },
  error: {
    color: theme.colors.danger,
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  imagePreview: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 4,
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  imageButtonText: { color: theme.colors.primary, fontSize: 15, fontFamily: theme.fonts.bodyBold },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16, fontFamily: theme.fonts.bodyBold },
});
