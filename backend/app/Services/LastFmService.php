<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class LastFmService
{
    /**
     * @param  array<int, array<string, mixed>>  $tracks
     * @return array<int, array<string, mixed>>
     */
    public function enrichTracks(array $tracks): array
    {
        $apiKey = (string) config('services.lastfm.api_key');
        $baseUri = (string) config('services.lastfm.base_uri', 'https://ws.audioscrobbler.com/2.0/');

        if ($apiKey === '') {
            return $tracks;
        }

        return array_map(function (array $track) use ($apiKey, $baseUri) {
            if (! empty($track['lastfmUrl']) || ! empty($track['coverUrl'])) {
                return $track;
            }

            $title = (string) ($track['title'] ?? '');
            $artist = (string) ($track['artist'] ?? '');

            if ($title === '' || $artist === '') {
                return $track;
            }

            try {
                $response = Http::timeout(10)->get($baseUri, [
                    'method' => 'track.getInfo',
                    'api_key' => $apiKey,
                    'artist' => $artist,
                    'track' => $title,
                    'autocorrect' => 1,
                    'format' => 'json',
                ]);

                if (! $response->successful()) {
                    return $track;
                }

                $payload = $response->json();
                $info = is_array($payload) ? ($payload['track'] ?? null) : null;

                if (! is_array($info)) {
                    return $track;
                }

                $track['lastfmUrl'] = (string) ($info['url'] ?? ($track['lastfmUrl'] ?? ''));

                $images = Arr::get($info, 'album.image', []);
                if (is_array($images) && ! empty($images)) {
                    $best = '';
                    foreach ($images as $img) {
                        if (! is_array($img)) {
                            continue;
                        }
                        $url = (string) ($img['#text'] ?? '');
                        if ($url !== '') {
                            $best = $url;
                        }
                    }
                    if ($best !== '') {
                        $track['coverUrl'] = $best;
                    }
                }

                $tags = Arr::get($info, 'toptags.tag', []);
                if (is_array($tags)) {
                    $names = [];
                    foreach ($tags as $t) {
                        if (is_array($t) && isset($t['name'])) {
                            $name = trim((string) $t['name']);
                            if ($name !== '') {
                                $names[] = $name;
                            }
                        }
                    }
                    if (! empty($names)) {
                        $track['tags'] = array_slice(array_values(array_unique($names)), 0, 5);
                    }
                }

                $track['listeners'] = Arr::get($info, 'listeners', $track['listeners'] ?? null);
                $track['playcount'] = Arr::get($info, 'playcount', $track['playcount'] ?? null);
                $track['duration'] = Arr::get($info, 'duration', $track['duration'] ?? null);
            } catch (\Throwable $e) {
                return $track;
            }

            return $track;
        }, $tracks);
    }
}
