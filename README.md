# 🚀 Cosmic Music Player

A futuristic, cyberpunk-themed music player built with HTML, CSS, and JavaScript. Features a space-themed playlist with neon blue and pink aesthetics inspired by cyberpunk design.

## 🎵 Features

- **Futuristic Design**: Cyberpunk-inspired interface with neon blue and pink color scheme
- **Space-Themed Playlist**: Curated collection of space-related music including:
  - Interstellar OST (Hans Zimmer)
  - Stellaris OST
  - Star Wars OST (John Williams)
  - Mass Effect OST
  - 2001: A Space Odyssey classics
- **Interactive Controls**: Play, pause, previous, next, and volume control
- **Visual Effects**: 
  - Floating particles animation
  - Mouse-responsive background gradients
  - Glowing neon effects
  - Smooth transitions and hover effects
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: 
  - Space: Play/Pause
  - Arrow Keys: Navigation and volume control

## 🎮 Controls

### Mouse/Touch
- Click any song in the playlist to play it
- Use the control buttons for playback
- Adjust volume with the slider
- Click on progress bar to seek (when audio files are added)

### Keyboard Shortcuts
- `Space`: Play/Pause
- `←/→`: Previous/Next track  
- `↑/↓`: Volume up/down

## 🛠️ Technical Details

### Files Structure
```
browser-music-player/
├── index.html          # Main HTML structure
├── style.css           # Cyberpunk styling and animations
├── script.js           # Music player functionality
└── README.md          # This file
```

### Technologies Used
- **HTML5**: Semantic structure and audio element
- **CSS3**: Advanced styling, gradients, animations, and responsive design
- **JavaScript ES6+**: Class-based architecture and modern features
- **Google Fonts**: Orbitron font for futuristic typography

## 🎨 Design Features

- **Gradient Backgrounds**: Dynamic color transitions
- **Neon Glow Effects**: CSS box-shadow and text-shadow
- **Animated Particles**: Floating background elements
- **Interactive Hover States**: Smooth transitions and scale effects
- **Glass Morphism**: Backdrop blur effects
- **Responsive Layout**: Mobile-first design approach

## 🚀 Getting Started

1. Clone or download the repository
2. Open `index.html` in your web browser
3. Enjoy the cosmic music experience!

### Adding Real Audio Files

To use actual audio files:

1. Add your audio files to an `audio/` directory
2. Update the `tracks` array in `script.js` with real file paths:
```javascript
{
    name: "No Time for Caution",
    artist: "Hans Zimmer",
    duration: "4:05",
    url: "audio/no-time-for-caution.mp3"
}
```
3. The player will automatically load and play the audio files

## 🎵 Current Playlist

1. **No Time for Caution** - Hans Zimmer (Interstellar OST) - 4:05
2. **Cornfield Chase** - Hans Zimmer (Interstellar OST) - 2:06
3. **Space Exploration** - Stellaris OST - 3:42
4. **Deus Ex Machina** - Stellaris OST - 4:18
5. **Also sprach Zarathustra** - Richard Strauss (2001: A Space Odyssey) - 8:45
6. **Blue Danube** - Johann Strauss II (2001: A Space Odyssey) - 6:30
7. **Adagio for Strings** - Samuel Barber - 7:25
8. **Binary Sunset** - John Williams (Star Wars) - 2:55
9. **Imperial March** - John Williams (Star Wars) - 3:02
10. **Duel of the Fates** - John Williams (Star Wars) - 4:14
11. **Across the Stars** - John Williams (Star Wars) - 5:33
12. **Horizon** - Stellaris OST - 3:28
13. **Into the Void** - Mass Effect OST - 4:45
14. **Leaving Earth** - Mass Effect 3 OST - 3:15
15. **Shepard's Theme** - Mass Effect OST - 2:38

## 🔧 Customization

### Colors
The color scheme can be customized by modifying CSS variables:
- Primary: `#ff0096` (Neon Pink)
- Secondary: `#00ffff` (Cyan)
- Background: `#0a0a0a` to `#16213e` (Dark gradient)

### Adding New Tracks
Add new tracks to the `tracks` array in `script.js`:
```javascript
{
    name: "Track Name",
    artist: "Artist Name",
    duration: "3:45",
    durationSeconds: 225,
    url: "path/to/audio/file.mp3"
}
```

## 🌟 Future Enhancements

- [ ] Audio visualization
- [ ] Playlist shuffle and repeat modes
- [ ] Equalizer controls
- [ ] Local storage for user preferences
- [ ] Drag and drop playlist reordering
- [ ] Full-screen mode
- [ ] Theme customization options

## 📱 Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📄 License

This project is open source and available under the MIT License.

## 🎵 Note

This is a demo version with simulated playback. To use with actual audio files, you'll need to:
1. Add audio files to your project
2. Update the track URLs in the JavaScript
3. Ensure your web server can serve the audio files

Enjoy your cosmic music journey! 🚀✨