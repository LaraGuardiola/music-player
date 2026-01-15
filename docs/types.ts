import { MediaFile } from "@odion-cloud/capacitor-mediastore";

export interface Track extends MediaFile {
  durationSeconds: number;
  duration: any;
  artist: string;
  albumArtUri: string;
  dateAdded: number;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: Date;
  isSystem?: boolean;
}
