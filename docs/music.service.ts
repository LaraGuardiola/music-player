import { Capacitor } from "@capacitor/core";
import {
  CapacitorMediaStore,
  MediaType,
} from "@odion-cloud/capacitor-mediastore";
import { fetchTracks } from "./api";

interface Track {
  name: string;
  artist: string;
  url: string;
  duration: string;
  durationSeconds: number;
  path: string;
  album?: string;
  mediaStoreUri?: string; // URI original de MediaStore
}

export class MediaStoreService {
  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  static async requestPermissions(): Promise<boolean> {
    if (!this.isNative()) return true;

    try {
      // check current status
      const status = await CapacitorMediaStore.checkPermissions();

      const hasPermission =
        status.readMediaAudio === "granted" ||
        status.readExternalStorage === "granted";

      if (hasPermission) {
        return true;
      }

      //still "prompted"
      const result = await CapacitorMediaStore.requestPermissions();

      return (
        result.readMediaAudio === "granted" ||
        result.readExternalStorage === "granted"
      );
    } catch (error) {
      console.error("Error requesting permissions:", error);
      return false;
    }
  }

  static async scanDeviceMusic(): Promise<Track[]> {
    if (!this.isNative()) return [];

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error("Storage permission is required to access music files");
    }

    try {
      const result = await CapacitorMediaStore.getMediasByType({
        mediaType: MediaType.AUDIO,
        sortBy: "TITLE",
        sortOrder: "ASC",
        includeExternal: true,
      });

      if (!result.media || result.media.length === 0) {
        return [];
      }

      return result.media.map((file) => {
        const durationSeconds = Math.floor((file.duration || 0) / 1000);

        return {
          name: file.title || file.displayName || "Unknown",
          artist: file.artist || "Unknown Artist",
          album: file.album || "Unknown Album",
          url: file.uri || "",
          path: file.uri || "",
          mediaStoreUri: file.uri || "",
          duration: this.formatDuration(durationSeconds),
          durationSeconds,
        };
      });
    } catch (error) {
      console.error("Error scanning device music:", error);
      throw error;
    }
  }

  static async getPlayableUrl(uri: string): Promise<string> {
    // Android file:// convert to URL for webview
    if (uri.startsWith("file://")) {
      return Capacitor.convertFileSrc(uri);
    }

    // content:// -> read as base64, then create Blob
    if (uri.startsWith("content://")) {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();

        const url = URL.createObjectURL(blob);
        return url;
      } catch (err) {
        console.error("Error converting content URI:", err);
        return "";
      }
    }

    return uri;
  }

  static async waitForTracks(): Promise<Track[]> {
    const tracks = await fetchTracks();
    if (tracks.length > 0) {
      return tracks;
    }
    return [];
  }

  static async getAlbums() {
    try {
      const result = await CapacitorMediaStore.getAlbums();
      return result.albums || [];
    } catch (error) {
      console.error("Error getting albums:", error);
      return [];
    }
  }

  static async getTracksByArtist(artistName: string): Promise<Track[]> {
    try {
      const result = await CapacitorMediaStore.getMediasByType({
        mediaType: MediaType.AUDIO,
        artistName,
        includeExternal: true,
      });

      return result.media.map((file) => ({
        name: file.title || "Unknown",
        artist: file.artist || "Unknown Artist",
        album: file.album || "Unknown Album",
        url: file.uri || "",
        path: file.uri || "",
        mediaStoreUri: file.uri || "",
        duration: this.formatDuration(Math.floor((file.duration || 0) / 1000)),
        durationSeconds: Math.floor((file.duration || 0) / 1000),
      }));
    } catch (error) {
      console.error("Error getting tracks by artist:", error);
      return [];
    }
  }

  static async getTracksByAlbum(albumName: string): Promise<Track[]> {
    try {
      const result = await CapacitorMediaStore.getMediasByType({
        mediaType: MediaType.AUDIO,
        albumName,
        includeExternal: true,
      });

      return result.media.map((file) => ({
        name: file.title || "Unknown",
        artist: file.artist || "Unknown Artist",
        album: file.album || "Unknown Album",
        url: file.uri || "",
        path: file.uri || "",
        mediaStoreUri: file.uri || "",
        duration: this.formatDuration(Math.floor((file.duration || 0) / 1000)),
        durationSeconds: Math.floor((file.duration || 0) / 1000),
      }));
    } catch (error) {
      console.error("Error getting tracks by album:", error);
      return [];
    }
  }

  private static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
}
