import { Track } from "./types";

export const displayActiveOption = () => {
  const headerButtons = document.querySelectorAll(".header-option");
  headerButtons.forEach((btn) => {
    console.log("hola boton");
    btn.addEventListener("click", () => {
      headerButtons.forEach((btn) => btn.classList.remove("active"));
      btn.classList.add("active");
    });
  });
};

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
