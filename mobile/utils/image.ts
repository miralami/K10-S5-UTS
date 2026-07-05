import { API_BASE_URL } from "../constants/config";

export function resolveImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  return imageUrl.replace(
    /http:\/\/localhost(:\d+)?/,
    API_BASE_URL.replace(/\/+$/, '')
  );
}
