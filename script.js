class CosmicMusicPlayer {
    constructor() {
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.audio = document.getElementById('audio-player');
        this.playBtn = document.getElementById('play-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.volumeSlider = document.getElementById('volume-slider');
        this.progressFill = document.getElementById('progress-fill');
        this.currentTimeDisplay = document.getElementById('current-time');
        this.totalTimeDisplay = document.getElementById('total-time');
        this.currentTrackName = document.getElementById('current-track-name');
        this.currentTrackDuration = document.getElementById('current-track-duration');
        this.playlist = document.getElementById('playlist');

        // Space-themed playlist with estimated durations
        this.tracks = [
            {
                name: "No Time for Caution",
                artist: "Hans Zimmer (Interstellar OST)",
                duration: "4:05",
                durationSeconds: 245,
                url: "#" // Placeholder - would need actual audio files
            },
            {
                name: "Cornfield Chase",
                artist: "Hans Zimmer (Interstellar OST)",
                duration: "2:06",
                durationSeconds: 126,
                url: "#"
            },
            {
                name: "Space Exploration",
                artist: "Stellaris OST",
                duration: "3:42",
                durationSeconds: 222,
                url: "#"
            },
            {
                name: "Deus Ex Machina",
                artist: "Stellaris OST",
                duration: "4:18",
                durationSeconds: 258,
                url: "#"
            },
            {
                name: "Also sprach Zarathustra",
                artist: "Richard Strauss (2001: A Space Odyssey)",
                duration: "8:45",
                durationSeconds: 525,
                url: "#"
            },
            {
                name: "Blue Danube",
                artist: "Johann Strauss II (2001: A Space Odyssey)",
                duration: "6:30",
                durationSeconds: 390,
                url: "#"
            },
            {
                name: "Adagio for Strings",
                artist: "Samuel Barber (Platoon/Space Movies)",
                duration: "7:25",
                durationSeconds: 445,
                url: "#"
            },
            {
                name: "Binary Sunset",
                artist: "John Williams (Star Wars)",
                duration: "2:55",
                durationSeconds: 175,
                url: "#"
            },
            {
                name: "Imperial March",
                artist: "John Williams (Star Wars)",
                duration: "3:02",
                durationSeconds: 182,
                url: "#"
            },
            {
                name: "Duel of the Fates",
                artist: "John Williams (Star Wars)",
                duration: "4:14",
                durationSeconds: 254,
                url: "#"
            },
            {
                name: "Across the Stars",
                artist: "John Williams (Star Wars)",
                duration: "5:33",
                durationSeconds: 333,
                url: "#"
            },
            {
                name: "Horizon",
                artist: "Stellaris OST",
                duration: "3:28",
                durationSeconds: 208,
                url: "#"
            },
            {
                name: "Into the Void",
                artist: "Mass Effect OST",
                duration: "4:45",
                durationSeconds: 285,
                url: "#"
            },
            {
                name: "Leaving Earth",
                artist: "Mass Effect 3 OST",
                duration: "3:15",
                durationSeconds: 195,
                url: "#"
            },
            {
                name: "Shepard's Theme",
                artist: "Mass Effect OST",
                duration: "2:38",
                durationSeconds: 158,
                url: "#"
            }
        ];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderPlaylist();
        this.loadTrack(0);
        this.updateVolumeDisplay();
    }

    setupEventListeners() {
        // Play/Pause button
        this.playBtn.addEventListener('click', () => this.togglePlay());

        // Previous/Next buttons
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());

        // Volume slider
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));

        // Audio events
        this.audio.addEventListener('loadedmetadata', () => this.updateTrackInfo());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextTrack());

        // Progress bar click (for seeking)
        document.querySelector('.progress-bar').addEventListener('click', (e) => this.seek(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    renderPlaylist() {
        this.playlist.innerHTML = '';

        this.tracks.forEach((track, index) => {
            const playlistItem = document.createElement('div');
            playlistItem.className = 'playlist-item';
            playlistItem.dataset.index = index;

            playlistItem.innerHTML = `
                <div class="song-info">
                    <div class="song-name">${track.name}</div>
                    <div class="song-artist">${track.artist}</div>
                </div>
                <div class="song-duration">${track.duration}</div>
            `;

            playlistItem.addEventListener('click', () => this.selectTrack(index));
            this.playlist.appendChild(playlistItem);
        });
    }

    selectTrack(index) {
        this.currentTrackIndex = index;
        this.loadTrack(index);
        this.updateActiveTrack();

        // Auto-play when selecting a track
        if (this.isPlaying) {
            this.play();
        }
    }

    loadTrack(index) {
        const track = this.tracks[index];
        this.currentTrackName.textContent = track.name;
        this.currentTrackDuration.textContent = track.duration;

        // In a real implementation, you would set the audio source here
        // this.audio.src = track.url;

        // For demo purposes, we'll simulate the track loading
        this.simulateTrackLoad(track);
        this.updateActiveTrack();
    }

    simulateTrackLoad(track) {
        // Simulate loading a track by setting up fake duration
        // In a real app, this would happen when the audio file loads
        this.totalTimeDisplay.textContent = track.duration;
        this.progressFill.style.width = '0%';
        this.currentTimeDisplay.textContent = '0:00';
    }

    updateActiveTrack() {
        // Remove active class from all items
        document.querySelectorAll('.playlist-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current track
        const activeItem = document.querySelector(`.playlist-item[data-index="${this.currentTrackIndex}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        // In a real implementation:
        // this.audio.play();

        this.isPlaying = true;
        this.playBtn.textContent = '⏸';
        this.startProgressSimulation();
    }

    pause() {
        // In a real implementation:
        // this.audio.pause();

        this.isPlaying = false;
        this.playBtn.textContent = '▶';
        this.stopProgressSimulation();
    }

    previousTrack() {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
        this.loadTrack(this.currentTrackIndex);

        if (this.isPlaying) {
            this.play();
        }
    }

    nextTrack() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
        this.loadTrack(this.currentTrackIndex);

        if (this.isPlaying) {
            this.play();
        }
    }

    setVolume(value) {
        // In a real implementation:
        // this.audio.volume = value / 100;

        // Visual feedback for volume change
        this.updateVolumeDisplay();
    }

    updateVolumeDisplay() {
        const volume = this.volumeSlider.value;
        this.volumeSlider.style.background = `linear-gradient(to right, #ff0096 0%, #00ffff ${volume}%, rgba(255,255,255,0.1) ${volume}%)`;
    }

    seek(e) {
        const progressBar = e.currentTarget;
        const clickX = e.offsetX;
        const width = progressBar.offsetWidth;
        const percentage = (clickX / width) * 100;

        // In a real implementation:
        // const newTime = (percentage / 100) * this.audio.duration;
        // this.audio.currentTime = newTime;

        // For demo purposes, just update the visual progress
        this.progressFill.style.width = percentage + '%';
    }

    updateProgress() {
        // In a real implementation:
        // const percentage = (this.audio.currentTime / this.audio.duration) * 100;
        // this.progressFill.style.width = percentage + '%';
        // this.currentTimeDisplay.textContent = this.formatTime(this.audio.currentTime);
    }

    updateTrackInfo() {
        // In a real implementation:
        // this.totalTimeDisplay.textContent = this.formatTime(this.audio.duration);
    }

    // Demo progress simulation (since we don't have actual audio files)
    startProgressSimulation() {
        const track = this.tracks[this.currentTrackIndex];
        let currentTime = 0;

        this.progressInterval = setInterval(() => {
            if (currentTime >= track.durationSeconds) {
                this.nextTrack();
                return;
            }

            currentTime += 1;
            const percentage = (currentTime / track.durationSeconds) * 100;
            this.progressFill.style.width = percentage + '%';
            this.currentTimeDisplay.textContent = this.formatTime(currentTime);
        }, 1000);
    }

    stopProgressSimulation() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    handleKeyboard(e) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousTrack();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextTrack();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.volumeSlider.value = Math.min(100, parseInt(this.volumeSlider.value) + 10);
                this.setVolume(this.volumeSlider.value);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.volumeSlider.value = Math.max(0, parseInt(this.volumeSlider.value) - 10);
                this.setVolume(this.volumeSlider.value);
                break;
        }
    }
}

// Initialize the music player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CosmicMusicPlayer();
});

// Add some visual effects for enhanced experience
document.addEventListener('DOMContentLoaded', () => {
    // Add floating particles effect
    createFloatingParticles();

    // Add mouse move effect for subtle interactivity
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        document.body.style.background = `
            linear-gradient(135deg,
                #0a0a0a 0%,
                #1a1a2e 50%,
                #16213e 100%),
            radial-gradient(circle at ${x * 100}% ${y * 100}%,
                rgba(255, 0, 150, 0.1) 0%,
                transparent 50%),
            radial-gradient(circle at ${(1-x) * 100}% ${(1-y) * 100}%,
                rgba(0, 255, 255, 0.1) 0%,
                transparent 50%)
        `;
    });
});

function createFloatingParticles() {
    const particleCount = 50;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '2px';
        particle.style.height = '2px';
        particle.style.background = Math.random() > 0.5 ? '#ff0096' : '#00ffff';
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '-1';
        particle.style.opacity = '0.3';
        particle.style.boxShadow = `0 0 6px ${particle.style.background}`;

        document.body.appendChild(particle);
        particles.push({
            element: particle,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        });
    }

    function animateParticles() {
        particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
            if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;

            particle.element.style.left = particle.x + 'px';
            particle.element.style.top = particle.y + 'px';
        });

        requestAnimationFrame(animateParticles);
    }

    animateParticles();
}
