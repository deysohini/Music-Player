document.addEventListener('DOMContentLoaded', () => {
    fetch('/songs')
        .then(response => response.json())
        .then(data => {
            let playlist = data.songs;
            let shuffledPlaylist = [...playlist];
            let currentSongIndex = 0;
            let isShuffled = false;
            let queueUpdating = false; // Prevent concurrent queue updates

            const audioPlayer = new Audio();
            const playPauseBtn = document.getElementById('play-pause-btn');
            const nextBtn = document.getElementById('next-btn');
            const prevBtn = document.getElementById('prev-btn');
            const shuffleBtn = document.getElementById('shuffle-btn');
            const seekBar = document.getElementById('seek-bar');
            const volumeBar = document.getElementById('volume-bar');
            const currentTimeDisplay = document.getElementById('current-time');
            const durationDisplay = document.getElementById('duration');
            const musicThumbnail = document.getElementById('music-thumbnail');
            const songTitle = document.getElementById('song-title');
            const queueList = document.getElementById('queue-list');
            const playlistQueue = document.querySelector('.playlist-queue');
            const toggleQueueBtn = document.getElementById('toggle-queue-btn');

            // Menu elements
            const menu = document.getElementById('menu');
            const toggleMenuBtn = document.getElementById('toggle-menu-btn');
            const uploadSongInput = document.getElementById('upload-song');
            const removeSongBtn = document.getElementById('remove-song');
            const songListSelect = document.getElementById('song-list');

            // Toggle the visibility of the playlist queue
            toggleQueueBtn.addEventListener('click', function() {
                if (playlistQueue.style.display === 'none' || playlistQueue.style.display === '') {
                    playlistQueue.style.display = 'block';
                    toggleQueueBtn.textContent = 'Hide Queue'; // Change button text
                } else {
                    playlistQueue.style.display = 'none';
                    toggleQueueBtn.textContent = 'Queue'; // Change button text
                }
            });

            // Toggle the visibility of the menu
            toggleMenuBtn.addEventListener('click', function() {
                if (menu.style.display === 'none' || menu.style.display === '') {
                    menu.style.display = 'block';
                    toggleMenuBtn.textContent = 'Hide Menu'; // Change button text
                } else {
                    menu.style.display = 'none';
                    toggleMenuBtn.textContent = 'Menu'; // Change button text
                }
            });

            // Function to shuffle playlist
            function shufflePlaylist(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            }

            // Function to format time
            function formatTime(seconds) {
                const minutes = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
            }

            // Function to update time display
            function updateTime() {
                if (audioPlayer.duration) {
                    const currentTime = audioPlayer.currentTime;
                    const duration = audioPlayer.duration;
                    currentTimeDisplay.textContent = formatTime(currentTime);
                    durationDisplay.textContent = formatTime(duration);
                    const progress = (currentTime / duration) * 100;
                    seekBar.value = progress;
                }
            }

            // Function to remove .mp3 extension
            function removeMp3Extension(songName) {
                return songName.replace('.mp3', '');
            }

            // Function to load and play song
            function loadSong(index) {
                const songPath = `/static/music/${shuffledPlaylist[index]}`;
                audioPlayer.src = songPath;
                audioPlayer.play();
                playPauseBtn.classList.add('playing');

                const thumbnailPath = `/static/images/thumbnail_${shuffledPlaylist[index].replace('.mp3', '.gif')}`;
                musicThumbnail.src = thumbnailPath;

                // Remove .mp3 extension before displaying in the player box
                songTitle.textContent = removeMp3Extension(shuffledPlaylist[index]);

                // Ensure queue is updated only if it's not already being updated
                if (!queueUpdating) {
                    queueUpdating = true;
                    updateQueue().finally(() => queueUpdating = false); // Reset flag when done
                }

                musicThumbnail.onerror = () => {
                    musicThumbnail.src = '/static/images/default-thumbnail.gif';
                };

                // Listen for metadata to be loaded
                audioPlayer.addEventListener('loadedmetadata', () => {
                    updateTime(); // Initial call to update time display
                });
            }

            // Function to get the duration of a song
            function getSongDuration(src) {
                return new Promise((resolve, reject) => {
                    const tempAudio = new Audio(src);
                    tempAudio.addEventListener('loadedmetadata', () => {
                        resolve(tempAudio.duration);
                    });
                    tempAudio.addEventListener('error', reject);
                });
            }

            // Function to update the queue
            async function updateQueue() {
                queueList.innerHTML = ''; // Clear existing items
                const queueToShow = isShuffled ? shuffledPlaylist : playlist;

                // Loop through the songs and create list items with durations
                for (let i = 0; i < queueToShow.length; i++) {
                    const song = queueToShow[i];
                    const songPath = `/static/music/${song}`;

                    // Create list item for song
                    const li = document.createElement('li');
                    
                    // Remove .mp3 extension before displaying in the queue
                    li.textContent = removeMp3Extension(song);
                    li.classList.add('queue-item');

                    // Create a span for duration
                    const durationSpan = document.createElement('span');
                    durationSpan.classList.add('song-duration');
                    durationSpan.textContent = 'Loading...'; // Placeholder text

                    li.appendChild(durationSpan);

                    // Fetch the duration and update the duration span
                    try {
                        const duration = await getSongDuration(songPath);
                        durationSpan.textContent = formatTime(duration);
                    } catch (error) {
                        console.error('Error fetching song duration:', error);
                        durationSpan.textContent = 'Error';
                    }

                    li.addEventListener('click', () => {
                        currentSongIndex = i;
                        loadSong(currentSongIndex);
                    });
                    queueList.appendChild(li);
                }
            }

            // Handle song upload
            uploadSongInput.addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (file) {
                    const newSong = file.name;
                    playlist.push(newSong); // Add the new song to the playlist
                    songListSelect.innerHTML += `<option value="${newSong}">${removeMp3Extension(newSong)}</option>`;
                    updateQueue(); // Update the queue to include the new song
                }
            });

            // Handle song removal
            removeSongBtn.addEventListener('click', function() {
                const selectedSong = songListSelect.value;
                if (selectedSong) {
                    playlist = playlist.filter(song => song !== selectedSong); // Remove from playlist
                    songListSelect.querySelector(`option[value="${selectedSong}"]`).remove(); // Remove from dropdown
                    updateQueue(); // Update the queue to reflect removal
                }
            });

            // Play/Pause button event
            playPauseBtn.addEventListener('click', function() {
                if (audioPlayer.paused) {
                    audioPlayer.play();
                    playPauseBtn.classList.add('playing');
                } else {
                    audioPlayer.pause();
                    playPauseBtn.classList.remove('playing');
                }
            });

            // Next and Previous buttons event
            nextBtn.addEventListener('click', function() {
                currentSongIndex = (currentSongIndex + 1) % shuffledPlaylist.length;
                loadSong(currentSongIndex);
            });

            prevBtn.addEventListener('click', function() {
                currentSongIndex = (currentSongIndex - 1 + shuffledPlaylist.length) % shuffledPlaylist.length;
                loadSong(currentSongIndex);
            });

            // Shuffle button event
            shuffleBtn.addEventListener('click', function() {
                isShuffled = !isShuffled;
                if (isShuffled) {
                    shuffledPlaylist = shufflePlaylist([...playlist]);
                } else {
                    shuffledPlaylist = [...playlist];
                }
                currentSongIndex = 0;
                loadSong(currentSongIndex);
            });

            // Automatically load the next song when the current one ends
            audioPlayer.addEventListener('ended', function() {
                currentSongIndex = (currentSongIndex + 1) % shuffledPlaylist.length;
                loadSong(currentSongIndex);
            });

            // Update seek bar and volume controls
            seekBar.addEventListener('input', () => {
                const seekTime = (seekBar.value / 100) * audioPlayer.duration;
                audioPlayer.currentTime = seekTime;
            });

            volumeBar.addEventListener('input', () => {
                audioPlayer.volume = volumeBar.value / 100;
            });

            audioPlayer.addEventListener('timeupdate', updateTime);

            // Initial load
            loadSong(currentSongIndex);
        })
        .catch(error => console.error('Error fetching song list:', error));
});
