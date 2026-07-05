import { useState } from "react";
import {
  Image,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ImageProps,
  ViewStyle,
} from "react-native";
import { resolveImageUrl } from "../utils/image";

interface Props extends Omit<ImageProps, "source"> {
  imageUrl: string | null;
  style?: ViewStyle;
  imageStyle?: ImageProps["style"];
}

export default function RemoteImage({
  imageUrl,
  style,
  imageStyle,
  ...rest
}: Props) {
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const uri = resolveImageUrl(imageUrl);

  if (!uri || errored) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderIcon}>🖼️</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="small" color="#9ca3af" />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[styles.image, imageStyle]}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setErrored(true); }}
        resizeMode="cover"
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: "100%", height: "100%" },
  placeholder: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loadingOverlay: {
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    zIndex: 1,
  },
  placeholderIcon: {
    fontSize: 28,
    opacity: 0.4,
  },
});
