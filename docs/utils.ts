import { Track } from "./types";

export const sortPlaylistByName = (tracks: Track[]) => {
  return tracks.sort((a, b) => {
    const nombreA = a.displayName.toUpperCase();
    const nombreB = b.displayName.toUpperCase();

    if (nombreA < nombreB) {
      return -1;
    }
    if (nombreA > nombreB) {
      return 1;
    }
    return 0;
  });
};
