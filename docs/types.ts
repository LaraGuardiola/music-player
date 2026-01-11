import { MediaFile } from "@odion-cloud/capacitor-mediastore";

export interface Track extends MediaFile {
  durationSeconds: number;
  duration: any;
  artist: string;
}
