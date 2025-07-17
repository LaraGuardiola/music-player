# 🎵 Tracks Folder

This folder contains the MP3 audio files for the Cosmic Music Player.

## 📁 Expected File Structure

Place your MP3 files in this folder with the following names:

```
tracks/
├── no-time-for-caution.mp3
├── cornfield-chase.mp3
├── space-exploration.mp3
├── deus-ex-machina.mp3
├── also-sprach-zarathustra.mp3
├── blue-danube.mp3
├── adagio-for-strings.mp3
├── binary-sunset.mp3
├── imperial-march.mp3
├── duel-of-the-fates.mp3
├── across-the-stars.mp3
├── horizon.mp3
├── into-the-void.mp3
├── leaving-earth.mp3
└── shepards-theme.mp3
```

## 🎼 Current Playlist

1. **no-time-for-caution.mp3** - Hans Zimmer (Interstellar OST)
2. **cornfield-chase.mp3** - Hans Zimmer (Interstellar OST)
3. **space-exploration.mp3** - Stellaris OST
4. **deus-ex-machina.mp3** - Stellaris OST
5. **also-sprach-zarathustra.mp3** - Richard Strauss (2001: A Space Odyssey)
6. **blue-danube.mp3** - Johann Strauss II (2001: A Space Odyssey)
7. **adagio-for-strings.mp3** - Samuel Barber
8. **binary-sunset.mp3** - John Williams (Star Wars)
9. **imperial-march.mp3** - John Williams (Star Wars)
10. **duel-of-the-fates.mp3** - John Williams (Star Wars)
11. **across-the-stars.mp3** - John Williams (Star Wars)
12. **horizon.mp3** - Stellaris OST
13. **into-the-void.mp3** - Mass Effect OST
14. **leaving-earth.mp3** - Mass Effect 3 OST
15. **shepards-theme.mp3** - Mass Effect OST

## 📝 How to Add Your MP3 Files

1. **Rename your MP3 files** to match the names above (use lowercase and hyphens)
2. **Place them in this folder** (`browser-music-player/tracks/`)
3. **Refresh the web page** - the player will automatically load them
4. **If a file is missing**, the player will use simulation mode for that track

## 🎵 Adding New Tracks

To add a completely new track:

1. **Add the MP3 file** to this folder
2. **Update the `tracks` array** in `script.js`:
```javascript
{
    name: "Your Song Name",
    artist: "Artist Name",
    duration: "3:45",
    durationSeconds: 225,
    url: "tracks/your-song-name.mp3"
}
```

## ⚠️ Important Notes

- **File format**: Only MP3 files are guaranteed to work
- **File size**: Keep files under 10MB for best performance
- **Naming**: Use lowercase letters and hyphens (no spaces)
- **Legal**: Only use music you own or have permission to use
- **Backup**: Keep copies of your original files elsewhere

## 🔧 Troubleshooting

If a track won't play:
1. **Check the filename** matches exactly (case-sensitive)
2. **Verify it's an MP3 file** (not MP4, WAV, etc.)
3. **Check file size** - very large files may not load
4. **Open browser console** (F12) to see error messages
5. **Test the file** in other audio players first

## 🎯 Demo Mode

If MP3 files are missing, the player will run in **demo mode** with:
- Visual progress simulation
- All UI functionality working
- No actual audio playback
- Console messages indicating missing files

This lets you test the interface before adding real audio files!