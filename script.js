// ===== State Management =====
let editMode = false; // Always false in viewer
let images = [];

// ===== Constants =====
const STORAGE_KEYS = {
    images: 'anniversary_images',
    startDate: 'relationship_start_date',
    victoryMessage: 'anniversary_victory_message',
    playlist: 'anniversary_playlist',
    playerPos: 'anniversary_player_position'
};
const START_DATE_KEY = STORAGE_KEYS.startDate;
const VICTORY_MESSAGE_KEY = STORAGE_KEYS.victoryMessage;
const PLAYLIST_KEY = STORAGE_KEYS.playlist;
const DEFAULT_VICTORY_MESSAGE = '¡Ganaste, mi amor! Cada momento contigo es una victoria ❤️';
const DEFAULT_PLAYLIST = ['https://soundcloud.com/user-228773727/romantic-lo-fi'];

// ===== DOM Elements =====
const canvas = document.getElementById('canvas');

// Game Elements
const secretTrigger = document.getElementById('secretTrigger');
const gameModal = document.getElementById('gameModal');
const gameBoard = document.getElementById('gameBoard');
const closeGameBtn = document.getElementById('closeGame');
const restartGameBtn = document.getElementById('restartGame');
const movesCount = document.getElementById('movesCount');
const pairsCount = document.getElementById('pairsCount');

// Victory Elements
const victoryModal = document.getElementById('victoryModal');
const victoryMessageText = document.getElementById('victoryMessageText');
const finalMoves = document.getElementById('finalMoves');
const playAgainBtn = document.getElementById('playAgain');
const closeVictoryBtn = document.getElementById('closeVictory');

// Counter Elements
const counterDisplay = document.getElementById('counterDisplay');

// Music/Player Elements
let scWidget = null;
let appPlaylist = [];
let currentTrackIndex = 0;
const musicPlayer = document.getElementById('musicPlayer');
const playerDragHandle = document.getElementById('playerDragHandle');
const prevTrackBtn = document.getElementById('prevTrack');
const nextTrackBtn = document.getElementById('nextTrack');
const playPauseBtn = document.getElementById('playPauseTrack');
const minimizeBtn = document.getElementById('minimizePlayer');
const trackInfoDisplay = document.getElementById('currentTrackInfo');
const trackSeekBar = document.getElementById('trackSeekBar');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('totalDuration');
const togglePlaylistBtn = document.getElementById('togglePlaylist');
const playerPlaylistContainer = document.getElementById('playerPlaylist');
const MUSIC_STATE_KEY = 'background_music_playing';

// Lightbox Elements
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxCounter = document.getElementById('lightboxCounter');

// Cursor Elements
const cursorTrail = document.getElementById('cursorTrail');

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    loadImages();
    syncSettingsToDOM(); // Sincronizar UI con ajustes del servidor
    renderImages();
    setupEventListeners();
    initializeRelationshipCounter();
    initializeMusicPlayer();
    initializeCursorTrail();
    initializeFloatingHearts();
});

function syncSettingsToDOM() {
    const appData = window.APP_IMAGES_DATA || { settings: {} };
    const settings = appData.settings || {};

    // 1. Actualizar Badge-text (si existe en los ajustes)
    if (settings.badgeText) {
        const badgeText = document.querySelector('.badge-text');
        if (badgeText) badgeText.textContent = settings.badgeText;
    }

    // 2. Otros elementos que el usuario quiera ver reflejados
}

// ===== Event Listeners Setup =====
function setupEventListeners() {
    // Secret Trigger (Heart Badge)
    let clickCount = 0;
    let clickTimer = null;

    if (secretTrigger) {
        secretTrigger.addEventListener('click', () => {
            clickCount++;
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => { clickCount = 0; }, 1000);
            if (clickCount === 3) {
                clickCount = 0;
                openGame();
            }
        });
    }

    // Game Controls
    if (closeGameBtn) closeGameBtn.addEventListener('click', closeGame);
    if (restartGameBtn) restartGameBtn.addEventListener('click', initializeGame);
    if (playAgainBtn) playAgainBtn.addEventListener('click', () => {
        closeVictory();
        initializeGame();
    });
    if (closeVictoryBtn) closeVictoryBtn.addEventListener('click', () => {
        closeVictory();
        closeGame();
    });

    // Lightbox Controls
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', () => navigateLightbox('prev'));
    if (lightboxNext) lightboxNext.addEventListener('click', () => navigateLightbox('next'));

    // Modals outside click
    [gameModal, victoryModal, lightbox].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (modal === gameModal) closeGame();
                    if (modal === victoryModal) closeVictory();
                    if (modal === lightbox) closeLightbox();
                }
            });
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox && lightbox.classList.contains('active')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigateLightbox('prev');
            if (e.key === 'ArrowRight') navigateLightbox('next');
        }
    });

    // Music Controls (Playlist)
    if (playPauseBtn) playPauseBtn.addEventListener('click', toggleMusic);
    if (nextTrackBtn) nextTrackBtn.addEventListener('click', () => changeTrack(1));
    if (prevTrackBtn) prevTrackBtn.addEventListener('click', () => changeTrack(-1));
    if (togglePlaylistBtn) togglePlaylistBtn.addEventListener('click', togglePlaylist);
    if (minimizeBtn) minimizeBtn.addEventListener('click', toggleMinimize);

    // Seek Logic
    if (trackSeekBar) {
        trackSeekBar.addEventListener('input', (e) => {
            if (!scWidget || !isPlayerReady) return;
            const seekTo = e.target.value;
            scWidget.seekTo(seekTo);
        });
    }

    // Draggable Logic
    initDraggablePlayer();
}

// ===== Image Loading & Rendering =====
function loadImages() {
    // 1. Cargar Ajustes (Prioridad: Código > LocalStorage)
    const appDataArr = Array.isArray(window.APP_IMAGES_DATA) ? { images: window.APP_IMAGES_DATA, settings: {} } : (window.APP_IMAGES_DATA || { settings: {}, images: [] });
    const serverSettings = appDataArr.settings || {};

    // Sincronizar ajustes con LocalStorage como respaldo y para uso inmediato
    if (serverSettings.startDate) localStorage.setItem(START_DATE_KEY, serverSettings.startDate);
    if (serverSettings.victoryMessage) localStorage.setItem(VICTORY_MESSAGE_KEY, serverSettings.victoryMessage);

    // Sincronizar Playlist
    const serverPlaylist = appDataArr.playlist || [];
    if (serverPlaylist.length > 0) {
        localStorage.setItem(PLAYLIST_KEY, JSON.stringify(serverPlaylist));
        appPlaylist = serverPlaylist;
    } else {
        const localPlaylist = JSON.parse(localStorage.getItem(PLAYLIST_KEY) || '[]');
        appPlaylist = localPlaylist.length > 0 ? localPlaylist : DEFAULT_PLAYLIST;
    }

    // 2. Cargar imágenes estáticas (archivos en /img/)
    const staticImages = (appDataArr.images || []).map(img => ({ ...img, type: 'server' }));

    // 3. Cargar imágenes de localStorage
    let localImages = [];
    if (typeof localStorage !== 'undefined') {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.images);
            if (stored) {
                localImages = JSON.parse(stored).map((img, index) => {
                    if (typeof img === 'string') return { src: img, date: '', type: 'local', originalIndex: index };
                    return { ...img, type: 'local', originalIndex: index };
                });
            }
        } catch (e) {
            console.error("Error cargando localStorage:", e);
        }
    }

    // 4. Combinar
    images = [...staticImages];
    localImages.forEach(localImg => {
        if (!images.find(img => img.src === localImg.src)) {
            images.push(localImg);
        }
    });
}

function renderImages() {
    if (!canvas) return;
    canvas.innerHTML = '';

    if (images.length === 0) {
        canvas.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📸</div><div class="empty-state-text">No hay fotos en nuestro álbum aún</div></div>';
        return;
    }

    // Configurar Intersection Observer para animaciones fluidas
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '50px'
    };

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Group images by date
    const grouped = images.reduce((acc, img, index) => {
        const date = img.date || 'Sin fecha';
        if (!acc[date]) acc[date] = [];
        acc[date].push({ ...img, originalIndex: index });
        return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    sortedDates.forEach(date => {
        const section = document.createElement('div');
        section.className = 'date-section';

        const header = document.createElement('h3');
        header.className = 'date-section-header';
        const formattedDate = date !== 'Sin fecha' ? new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : date;
        header.innerHTML = `<span>📅</span> ${formattedDate}`;
        section.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'canvas-grid';

        grouped[date].forEach(imgData => {
            const div = document.createElement('div');
            div.className = 'image-item';

            // Atributos de optimización
            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';

            const img = document.createElement('img');
            img.src = imgData.src;
            img.alt = `Memory`;
            img.loading = 'lazy'; // Lazy loading nativo
            img.decoding = 'async'; // Decodificación asíncrona
            img.style.cursor = 'pointer';

            img.addEventListener('click', (e) => {
                e.stopPropagation();
                openLightbox(imgData.originalIndex);
            });

            wrapper.appendChild(img);
            div.appendChild(wrapper);
            grid.appendChild(div);

            // Observar el contenedor para la animación
            imageObserver.observe(div);
        });

        section.appendChild(grid);
        canvas.appendChild(section);
    });
}

// ===== Lightbox Functions =====
let currentLightboxIndex = 0;
let lightboxImages = [];

function openLightbox(index) {
    if (!lightbox) return;
    lightboxImages = images.map(img => img.src);
    if (lightboxImages.length === 0) return;

    currentLightboxIndex = index;
    updateLightboxImage();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function updateLightboxImage() {
    if (lightboxImages.length === 0) return;
    if (lightboxImg) lightboxImg.src = lightboxImages[currentLightboxIndex];
    if (lightboxCounter) lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${lightboxImages.length}`;
}

function navigateLightbox(direction) {
    if (direction === 'prev') {
        currentLightboxIndex = (currentLightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
    } else {
        currentLightboxIndex = (currentLightboxIndex + 1) % lightboxImages.length;
    }
    updateLightboxImage();
}

// ===== Relationship Counter =====
let counterInterval = null;

function initializeRelationshipCounter() {
    if (counterInterval) clearInterval(counterInterval);
    updateRelationshipCounter();
    counterInterval = setInterval(updateRelationshipCounter, 1000);
}

function updateRelationshipCounter() {
    if (!counterDisplay) return;

    const savedDate = localStorage.getItem(START_DATE_KEY);
    if (!savedDate) {
        counterDisplay.innerHTML = '<span class="counter-loading">⏱️ Esperando fecha del panel admin...</span>';
        return;
    }

    const startDate = new Date(savedDate);
    if (isNaN(startDate.getTime())) {
        counterDisplay.innerHTML = '<span class="counter-loading">⚠️ Fecha inválida...</span>';
        return;
    }

    const now = new Date();
    const diff = now - startDate;

    if (diff < 0) {
        counterDisplay.innerHTML = '<span class="counter-loading">✨ ¡Pronto comenzará nuestro contador! ✨</span>';
        return;
    }

    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Exact calculation for years and months
    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let d = now.getDate() - startDate.getDate();

    if (d < 0) {
        months -= 1;
    }
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    // Days in current month for remaining days
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    let remainingDays = d < 0 ? (lastMonth.getDate() + d) : d;

    let timeString = '';
    if (years > 0) timeString += `${years} año${years > 1 ? 's' : ''}, `;
    if (months > 0 || years > 0) timeString += `${months} mes${months !== 1 ? 'es' : ''}, `;
    timeString += `${remainingDays} día${remainingDays !== 1 ? 's' : ''}<br>`;
    timeString += `<span class="time-units">${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</span>`;

    counterDisplay.innerHTML = timeString;
}

// ===== Memory Game Logic =====
const EMOJIS = ['✨', '🌙', '❤️', '☀️', '💕', '🎁', '🌹', '💍'];
let flippedCards = [];
let moves = 0;
let matchedPairs = 0;
let isProcessing = false;

function openGame() {
    if (!gameModal) return;
    gameModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    initializeGame();
}

function closeGame() {
    if (!gameModal) return;
    gameModal.classList.remove('active');
    document.body.style.overflow = '';
}

function initializeGame() {
    moves = 0;
    matchedPairs = 0;
    flippedCards = [];
    isProcessing = false;
    updateGameStats();

    const gameBoardEmojis = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);
    if (!gameBoard) return;
    gameBoard.innerHTML = '';

    gameBoardEmojis.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'game-card'; // Fixed class name to match CSS
        card.dataset.emoji = emoji;
        card.dataset.index = index;

        card.innerHTML = `
            <div class="card-face card-back">💝</div>
            <div class="card-face card-front">${emoji}</div>
        `;

        card.addEventListener('click', () => handleCardClick(card));
        gameBoard.appendChild(card);
    });
}

function handleCardClick(card) {
    if (isProcessing || card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        moves++;
        updateGameStats();
        checkMatch();
    }
}

function checkMatch() {
    isProcessing = true;
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.emoji === card2.dataset.emoji;

    if (isMatch) {
        matchedPairs++;
        // Pequeño delay para que se vea la animación de "match" antes de vaciar
        setTimeout(() => {
            card1.classList.add('matched');
            card2.classList.add('matched');
            flippedCards = [];
            isProcessing = false;

            if (matchedPairs === EMOJIS.length) {
                setTimeout(showVictory, 500); // Delay antes de la victoria
            }
        }, 300);
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            isProcessing = false;
        }, 1000);
    }
}

function updateGameStats() {
    if (movesCount) movesCount.textContent = moves;
    if (pairsCount) pairsCount.textContent = matchedPairs;
}

function showVictory() {
    const customMessage = localStorage.getItem(VICTORY_MESSAGE_KEY) || DEFAULT_VICTORY_MESSAGE;
    if (victoryMessageText) victoryMessageText.textContent = customMessage;
    if (finalMoves) finalMoves.textContent = moves;

    // Cerrar el modal del juego para que no tape la victoria
    if (gameModal) gameModal.classList.remove('active');

    if (victoryModal) victoryModal.classList.add('active');
    startConfetti();
}

function closeVictory() {
    if (victoryModal) victoryModal.classList.remove('active');
}

// ===== Confetti Animation =====
const confettiCanvas = document.getElementById('confettiCanvas');
let confettiParticles = [];
let confettiAnimationId = null;

class Confetti {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.size = Math.random() * 8 + 4;
        this.speedY = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 3;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 5;
        this.color = ['#D4AF37', '#FFB6C1', '#DDA0DD', '#FFE4E1', '#FF69B4'][Math.floor(Math.random() * 5)];
        this.isHeart = Math.random() > 0.5;
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        this.speedY += 0.05; // Gravedad suave
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;

        if (this.isHeart) {
            // Dibujar corazón con vectores puros (mucho más rápido que texto)
            ctx.beginPath();
            const s = this.size;
            ctx.moveTo(0, s / 2);
            ctx.bezierCurveTo(s / 2, 0, s, s / 2, 0, s);
            ctx.bezierCurveTo(-s, s / 2, -s / 2, 0, 0, s / 2);
            ctx.fill();
        } else {
            // Círculo simple
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

function startConfetti() {
    if (!confettiCanvas) return;
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    confettiCanvas.classList.add('active');
    confettiParticles = Array.from({ length: 40 }, () => new Confetti(confettiCanvas));

    function animate() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        // Actualizar y dibujar partículas
        confettiParticles.forEach(p => {
            p.update();
            p.draw(ctx);
        });

        // Filtrar partículas que salieron de pantalla (más seguro que splice en forEach)
        confettiParticles = confettiParticles.filter(p => p.y <= confettiCanvas.height);

        if (confettiParticles.length > 0) {
            confettiAnimationId = requestAnimationFrame(animate);
        } else {
            stopConfetti();
        }
    }
    animate();
}

function stopConfetti() {
    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
    confettiParticles = [];
    if (confettiCanvas) confettiCanvas.classList.remove('active');
}

// ===== Cursor Trail =====
function initializeCursorTrail() {
    if (window.innerWidth <= 768 || !cursorTrail) return;
    let lastTime = 0;
    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if (now - lastTime < 50) return;
        lastTime = now;
        const heart = document.createElement('div');
        heart.className = 'cursor-heart';
        heart.textContent = ['💕', '❤️', '💖'][Math.floor(Math.random() * 3)];
        heart.style.left = e.pageX + 'px';
        heart.style.top = e.pageY + 'px';
        cursorTrail.appendChild(heart);
        setTimeout(() => heart.remove(), 1500);
    });
}

// ===== Floating Hearts (Premium CSS) =====
function initializeFloatingHearts() {
    const container = document.getElementById('floatingHearts');
    if (!container) return;

    const heartCount = 15;
    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('div');
        heart.className = 'css-heart';

        const size = Math.random() * 25 + 15;
        const xStart = Math.random() * 100;
        const xMid = xStart + (Math.random() - 0.5) * 15;
        const xEnd = xStart + (Math.random() - 0.5) * 30;
        const duration = Math.random() * 20 + 20;
        const delay = Math.random() * -40;
        const opacity = Math.random() * 0.15 + 0.05;

        heart.style.setProperty('--size', `${size}px`);
        heart.style.setProperty('--x-start', `${xStart}vw`);
        heart.style.setProperty('--x-mid', `${xMid}vw`);
        heart.style.setProperty('--x-end', `${xEnd}vw`);
        heart.style.setProperty('--duration', `${duration}s`);
        heart.style.setProperty('--delay', `${delay}s`);
        heart.style.setProperty('--opacity', opacity);
        container.appendChild(heart);
    }
}

// ===== SoundCloud advanced Music Player =====
let isMusicPlaying = false;
let isPlayerReady = false;

function initializeMusicPlayer() {
    const iframe = document.getElementById('scPlayer');
    if (!iframe || appPlaylist.length === 0) return;

    // Cargar la primera canción de la playlist
    loadTrack(0);

    // Restaurar posición del reproductor
    const savedPos = JSON.parse(localStorage.getItem(STORAGE_KEYS.playerPos));
    if (savedPos && musicPlayer) {
        musicPlayer.style.left = savedPos.x + 'px';
        musicPlayer.style.top = savedPos.y + 'px';
        musicPlayer.style.bottom = 'auto';
        musicPlayer.style.right = 'auto';
    }
}

function loadTrack(index) {
    if (index < 0) index = appPlaylist.length - 1;
    if (index >= appPlaylist.length) index = 0;

    currentTrackIndex = index;
    const iframe = document.getElementById('scPlayer');
    const url = appPlaylist[currentTrackIndex];
    const encodedUrl = encodeURIComponent(url);

    // Si ya existe el widget, cargamos la nueva URL, si no, inicializamos
    if (scWidget) {
        scWidget.load(url, {
            auto_play: isMusicPlaying,
            hide_related: true,
            show_comments: false,
            show_user: false,
            show_reposts: false,
            show_teaser: false,
            visual: false
        });
    } else {
        iframe.src = `https://w.soundcloud.com/player/?url=${encodedUrl}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`;
        scWidget = SC.Widget(iframe);
        setupWidgetEvents();
    }

    updatePlayerUI();
}

function setupWidgetEvents() {
    scWidget.bind(SC.Widget.Events.READY, () => {
        isPlayerReady = true;
        // Obtener duración cada vez que el widget carga una pista nueva
        refreshDuration();

        if (localStorage.getItem(MUSIC_STATE_KEY) === 'true') {
            scWidget.play();
        }
    });

    scWidget.bind(SC.Widget.Events.PLAY_PROGRESS, (progress) => {
        if (trackSeekBar) trackSeekBar.value = progress.currentPosition;
        if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(progress.currentPosition);
    });

    scWidget.bind(SC.Widget.Events.PLAY, () => {
        isMusicPlaying = true;
        updatePlayerUI();
        localStorage.setItem(MUSIC_STATE_KEY, 'true');
    });

    scWidget.bind(SC.Widget.Events.PAUSE, () => {
        isMusicPlaying = false;
        updatePlayerUI();
        localStorage.setItem(MUSIC_STATE_KEY, 'false');
    });

    scWidget.bind(SC.Widget.Events.FINISH, () => {
        changeTrack(1); // Auto-next
    });
}

function toggleMusic() {
    if (!isPlayerReady || !scWidget) return;
    scWidget.toggle();
}

function changeTrack(direction) {
    loadTrack(currentTrackIndex + direction);
}

function refreshDuration() {
    if (!scWidget) return;
    scWidget.getDuration((duration) => {
        if (trackSeekBar) trackSeekBar.max = duration;
        if (durationDisplay) durationDisplay.textContent = formatTime(duration);
    });
}

function updatePlayerUI() {
    if (!playPauseBtn) return;

    // Update play/pause icon
    playPauseBtn.textContent = isMusicPlaying ? '⏸' : '▶';

    // Render Playlist visual
    renderPlayerPlaylist();

    // Update track info
    if (trackInfoDisplay && appPlaylist[currentTrackIndex]) {
        const url = appPlaylist[currentTrackIndex];
        const parts = url.split('/');
        const title = parts[parts.length - 1].split('?')[0].replace(/-/g, ' ');
        trackInfoDisplay.textContent = title || 'Música de amor';
    }
}

function renderPlayerPlaylist() {
    if (!playerPlaylistContainer) return;
    playerPlaylistContainer.innerHTML = appPlaylist.map((url, index) => {
        const parts = url.split('/');
        const title = parts[parts.length - 1].split('?')[0].replace(/-/g, ' ');
        const isActive = index === currentTrackIndex;
        return `
            <div class="playlist-item ${isActive ? 'active' : ''}" onclick="loadTrack(${index})">
                <span class="playlist-item-num">${String(index + 1).padStart(2, '0')}</span>
                <span class="playlist-item-title">${title}</span>
            </div>
        `;
    }).join('');
}

function togglePlaylist() {
    if (playerPlaylistContainer) {
        playerPlaylistContainer.classList.toggle('active');
        togglePlaylistBtn.textContent = playerPlaylistContainer.classList.contains('active') ? '✖' : '📜';
    }
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function toggleMinimize() {
    if (musicPlayer) {
        musicPlayer.classList.toggle('minimized');
        minimizeBtn.textContent = musicPlayer.classList.contains('minimized') ? '🎵' : '−';
        // Si minimizamos, cerramos la playlist
        if (playerPlaylistContainer) playerPlaylistContainer.classList.remove('active');
    }
}

// Draggable Logic
function initDraggablePlayer() {
    if (!musicPlayer || !playerDragHandle) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    playerDragHandle.onmousedown = dragMouseDown;
    playerDragHandle.ontouchstart = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        // Solo permitir arrastrar si no está minimizado o si se hace clic en el botón de música
        if (musicPlayer.classList.contains('minimized') && e.target !== minimizeBtn) return;

        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX || (e.touches && e.touches[0].clientX);
        pos4 = e.clientY || (e.touches && e.touches[0].clientY);

        document.onmouseup = closeDragElement;
        document.ontouchend = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
        document.ontouchmove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        // Calculate the new cursor position:
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;

        // set the element's new position:
        let newTop = musicPlayer.offsetTop - pos2;
        let newLeft = musicPlayer.offsetLeft - pos1;

        // Limites de pantalla
        const pad = 10;
        newTop = Math.max(pad, Math.min(newTop, window.innerHeight - musicPlayer.offsetHeight - pad));
        newLeft = Math.max(pad, Math.min(newLeft, window.innerWidth - musicPlayer.offsetWidth - pad));

        musicPlayer.style.top = newTop + "px";
        musicPlayer.style.left = newLeft + "px";
        musicPlayer.style.bottom = 'auto';
        musicPlayer.style.right = 'auto';
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;

        // Guardar posición
        localStorage.setItem(STORAGE_KEYS.playerPos, JSON.stringify({
            x: musicPlayer.offsetLeft,
            y: musicPlayer.offsetTop
        }));
    }
}
