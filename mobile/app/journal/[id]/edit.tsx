import { useEffect, useState } from "react";
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
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-root-toast';
import { JournalNote } from "../../../types";
import * as journalService from "../../../services/journal";
import RemoteImage from "../../../components/RemoteImage";
import { daysSince } from "../../../utils/date";
import { theme } from "../../../constants/theme";

export default function EditJournalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<JournalNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [gratitude1, setGratitude1] = useState("");
  const [gratitude2, setGratitude2] = useState("");
  const [gratitude3, setGratitude3] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    journalService
      .get(Number(id))
      .then((n: JournalNote) => {
        setNote(n);
        setTitle(n.title ?? "");
        setBody(n.body ?? "");
        setGratitude1(n.gratitude1 ?? "");
        setGratitude2(n.gratitude2 ?? "");
        setGratitude3(n.gratitude3 ?? "");
      })
      .catch((e: any) => setError(e?.message ?? "Failed to load entry"))
      .finally(() => setLoading(false));
  }, [id]);

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
        await journalService.updateWithImage(Number(id), form);
      } else {
        await journalService.update(Number(id), payload);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show("Entry saved.", { duration: Toast.durations.SHORT });
      router.back();
    } catch (e: any) {
      if (e?.response?.status === 403) {
        setError(
          "This entry can no longer be edited. The 3-day edit window has passed."
        );
      } else {
        setError(
          e?.response?.data?.message ??
            e?.message ??
            "Failed to update entry"
        );
      }
      // Extract per-field validation errors (only for 422)
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error && !note) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (note && daysSince(note.noteDate) > 3) {
    return (
      <View style={styles.centered}>
        <Text style={styles.restrictionMsg}>
          This entry can no longer be edited. The 3-day edit window has passed.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit Entry", headerShown: true }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={[styles.input, fieldErrors.title && styles.inputError]}
            value={title}
            onChangeText={(v) => { setTitle(v); setFieldErrors((prev) => ({ ...prev, title: "" })); }}
            editable={!submitting}
          />
          {fieldErrors.title ? <Text style={styles.fieldError}>{fieldErrors.title}</Text> : null}

          <Text style={styles.label}>Body</Text>
          <TextInput
            style={[styles.input, styles.textArea, fieldErrors.body && styles.inputError]}
            value={body}
            onChangeText={(v) => { setBody(v); setFieldErrors((prev) => ({ ...prev, body: "" })); }}
            multiline
            numberOfLines={6}
            editable={!submitting}
          />
          {fieldErrors.body ? <Text style={styles.fieldError}>{fieldErrors.body}</Text> : null}

          <Text style={styles.sectionLabel}>Image</Text>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          ) : note?.imageUrl ? (
            <RemoteImage
              imageUrl={note.imageUrl}
              style={styles.imagePreview}
            />
          ) : null}
          <TouchableOpacity
            style={styles.imageButton}
            onPress={pickImage}
            disabled={submitting}
          >
            <Text style={styles.imageButtonText}>
              {imageUri || note?.imageUrl ? "Change Image" : "Add Image"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Gratitudes</Text>
          <TextInput
            style={[styles.input, fieldErrors.gratitude_1 && styles.inputError]}
            value={gratitude1}
            onChangeText={(v) => { setGratitude1(v); setFieldErrors((prev) => ({ ...prev, gratitude_1: "" })); }}
            editable={!submitting}
          />
          {fieldErrors.gratitude_1 ? <Text style={styles.fieldError}>{fieldErrors.gratitude_1}</Text> : null}
          <TextInput
            style={[styles.input, fieldErrors.gratitude_2 && styles.inputError]}
            value={gratitude2}
            onChangeText={(v) => { setGratitude2(v); setFieldErrors((prev) => ({ ...prev, gratitude_2: "" })); }}
            editable={!submitting}
          />
          {fieldErrors.gratitude_2 ? <Text style={styles.fieldError}>{fieldErrors.gratitude_2}</Text> : null}
          <TextInput
            style={[styles.input, fieldErrors.gratitude_3 && styles.inputError]}
            value={gratitude3}
            onChangeText={(v) => { setGratitude3(v); setFieldErrors((prev) => ({ ...prev, gratitude_3: "" })); }}
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
              <Text style={styles.submitText}>Save Changes</Text>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    padding: 24,
  },
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
  errorText: { color: theme.colors.danger },
  restrictionMsg: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
  backButton: { padding: 12 },
  backText: { color: theme.colors.primary, fontFamily: theme.fonts.bodyBold, fontSize: 16 },
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
