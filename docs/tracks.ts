import { MediaType } from "@odion-cloud/capacitor-mediastore";
import { Track } from "./types";

export const mockTracks: Track[] = [
  {
    id: "1",
    displayName: "Mock Song 1",
    artist: "Test Artist A",
    album: "Test Album 1",
    duration: "3:45",
    durationSeconds: 225,
    uri: "mock://song1.mp3",
    albumArtUri: "",
    dateAdded: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
    size: 5000000,
    mimeType: "audio/mpeg",
    dateModified: Date.now() - 10 * 24 * 60 * 60 * 1000,
    mediaType: MediaType.AUDIO,
    track: 1
  },
  {
    id: "2",
    displayName: "Mock Song 2",
    artist: "Test Artist A",
    album: "Test Album 1",
    duration: "4:20",
    durationSeconds: 260,
    uri: "mock://song2.mp3",
    albumArtUri: "",
    dateAdded: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days ago
    size: 6000000,
    mimeType: "audio/mpeg",
    dateModified: Date.now() - 20 * 24 * 60 * 60 * 1000,
    mediaType: MediaType.AUDIO,
    track: 2
  },
  {
    id: "3",
    displayName: "Mock Song 3",
    artist: "Test Artist B",
    album: "Test Album 2",
    duration: "2:55",
    durationSeconds: 175,
    uri: "mock://song3.mp3",
    albumArtUri: "",
    dateAdded: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    size: 4000000,
    mimeType: "audio/mpeg",
    dateModified: Date.now() - 30 * 24 * 60 * 60 * 1000,
    mediaType: MediaType.AUDIO,
    track: 1
  },
  {
    id: "4",
    displayName: "Mock Song 4",
    artist: "Test Artist B",
    album: "Test Album 3",
    duration: "5:10",
    durationSeconds: 310,
    uri: "mock://song4.mp3",
    albumArtUri: "",
    dateAdded: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    size: 7000000,
    mimeType: "audio/mpeg",
    dateModified: Date.now() - 5 * 24 * 60 * 60 * 1000,
    mediaType: MediaType.AUDIO,
    track: 1
  },
  {
    id: "5",
    displayName: "Mock Song 5",
    artist: "Test Artist A",
    album: "Test Album 2",
    duration: "3:30",
    durationSeconds: 210,
    uri: "mock://song5.mp3",
    albumArtUri: "",
    dateAdded: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
    size: 5500000,
    mimeType: "audio/mpeg",
    dateModified: Date.now() - 15 * 24 * 60 * 60 * 1000,
    mediaType: MediaType.AUDIO,
    track: 1
  },
  {
    id: "6",
    displayName: "Mock Song 6",
    artist: "Test Artist C",
    album: "Test Album 3",
    duration: "4:05",
    durationSeconds: 245,
    uri: "mock://song6.mp3",
    albumArtUri: "",
    dateAdded: Date.now() - 40 * 24 * 60 * 60 * 1000, // 40 days ago (won't show in Last 90 Days)
    size: 6500000,
    mimeType: "audio/mpeg",
    dateModified: Date.now() - 40 * 24 * 60 * 60 * 1000,
    mediaType: MediaType.AUDIO,
    track: 2
  },
  {
    id: "7",
    displayName: "Mock Song 7",
    artist: "Test Artist A",
    album: "Test Album 2",
    duration: "3:15",
    durationSeconds: 195,
    uri: "mock://song7.mp3",
    albumArtUri: "",
    dateAdded: Date.now() - 25 * 24 * 60 * 60 * 1000, // 25 days ago
    size: 4800000,
    mimeType: "audio/mpeg",
    dateModified: Date.now() - 25 * 24 * 60 * 60 * 1000,
    mediaType: MediaType.AUDIO,
    track: 2
  },
  {
    id: "8",
    displayName: "Mock Song 8",
    artist: "Test Artist B",
    album: "Test Album 1",
    duration: "4:40",
    durationSeconds: 280,
    uri: "mock://song8.mp3",
    albumArtUri: "",
    dateAdded: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
    size: 6800000,
    mimeType: "audio/mpeg",
    dateModified: Date.now() - 8 * 24 * 60 * 60 * 1000,
    mediaType: MediaType.AUDIO,
    track: 3
  },
  {
    id: "9",
    displayName: "Mock Song 9",
    artist: "Test Artist C",
    album: "Test Album 4",
    duration: "2:20",
    durationSeconds: 140,
    uri: "mock://song9.mp3",
    albumArtUri: "",
    dateAdded: Date.now() - 12 * 24 * 60 * 60 * 1000, // 12 days ago
    size: 3800000,
    mimeType: "audio/mpeg",
    dateModified: Date.now() - 12 * 24 * 60 * 60 * 1000,
    mediaType: MediaType.AUDIO,
    track: 1
  },
  {
    id: "10",
    displayName: "Mock Song 10",
    artist: "Test Artist D",
    album: "Test Album 4",
    duration: "6:00",
    durationSeconds: 360,
    uri: "mock://song10.mp3",
    albumArtUri: "",
    dateAdded: Date.now() - 35 * 24 * 60 * 60 * 1000, // 35 days ago
    size: 8500000,
    mimeType: "audio/mpeg",
    dateModified: Date.now() - 35 * 24 * 60 * 60 * 1000,
    mediaType: MediaType.AUDIO,
    track: 2
  }
];