/**
 * COSMIC RUNNER
 * A Poki-compatible endless runner game
 * Mobile-first, HTML5, touch-friendly
 */

class CosmicRunner {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Responsive scaling
        this.scale = 1;
        this.baseWidth = 800;
        this.baseHeight = 450;

        // Game state
        this.state = 'loading';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('cosmicRunnerHighScore')) || 0;
        this.distance = 0;
        this.starsCollected = 0;
        this.gameSpeed = 5;
        this.baseSpeed = 5;

        // Power-ups
        this.powerup = null;
        this.powerupTimer = 0;
        this.shieldActive = false;
        this.doubleScoreActive = false;
        this.slowMotionActive = false;

        // Player
        this.player = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            velocityY: 0,
            gravity: 0,
            jumpForce: 0,
            isJumping: false,
            isSliding: false,
            slideTimer: 0,
            originalHeight: 0,
            slideHeight: 0,
            rotation: 0
        };

        // Game objects
        this.obstacles = [];
        this.stars = [];
        this.powerups = [];
        this.particles = [];
        this.starsBackground = [];

        // Timing
        this.lastTime = 0;
        this.obstacleTimer = 0;
        this.starTimer = 0;
        this.powerupTimerSpawn = 0;

        // Audio
        this.soundEnabled = true;
        this.audioContext = null;

        // Poki SDK
        this.pokiSDK = null;
        this.pokiAvailable = false;

        // Difficulty - EASIER progression
        this.difficultyLevel = 1;
        this.difficultyTimer = 0;
        this.maxDifficulty = 10;

        // Tutorial / Hints
        this.showHints = true;
        this.hintsShown = { jump: false, slide: false };
        this.tutorialTimeout = null;

        // Touch handling
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.minSwipeDistance = 30;

        // Bind methods
        this.resize = this.resize.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        this.handleJump = this.handleJump.bind(this);
        this.handleSlide = this.handleSlide.bind(this);

        // Initialize
        this.init();
    }

    async init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupResponsiveValues();
        this.initBackgroundStars();
        await this.initAudio();
        await this.initPokiSDK();
        this.updateHighScoreDisplay();
        this.showLoadingProgress();
    }

    setupCanvas() {
        this.resize();
        window.addEventListener('resize', this.resize);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.scale = Math.min(
            this.canvas.width / this.baseWidth,
            this.canvas.height / this.baseHeight
        );

        this.groundY = this.canvas.height - (this.canvas.height * 0.15);
        this.setupResponsiveValues();
    }

    setupResponsiveValues() {
        const basePlayerSize = Math.min(this.canvas.width, this.canvas.height) * 0.08;
        const playerSize = Math.max(40, Math.min(60, basePlayerSize));

        this.player.width = playerSize;
        this.player.height = playerSize;
        this.player.originalHeight = playerSize;
        this.player.slideHeight = playerSize * 0.5;
        this.player.x = this.canvas.width * 0.15;

        const scaleRatio = this.canvas.height / this.baseHeight;
        this.player.gravity = 0.6 * scaleRatio;  // Slightly lower gravity for easier control
        this.player.jumpForce = -13 * scaleRatio; // Slightly lower jump for better control

        if (this.state === 'menu' || this.state === 'loading') {
            this.player.y = this.groundY - this.player.height;
        }
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.state === 'playing') {
                if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') {
                    e.preventDefault();
                    this.handleJump();
                }
                if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                    e.preventDefault();
                    this.handleSlide();
                }
                if (e.code === 'Escape') {
                    e.preventDefault();
                    this.togglePause();
                }
            }
        });

        // Touch controls
        const touchControls = document.getElementById('touch-controls');
        if (touchControls) {
            touchControls.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
            }, { passive: false });

            touchControls.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (this.state !== 'playing') return;

                const touch = e.changedTouches[0];
                const deltaX = touch.clientX - this.touchStartX;
                const deltaY = touch.clientY - this.touchStartY;

                if (Math.abs(deltaY) > this.minSwipeDistance) {
                    if (deltaY < -this.minSwipeDistance) {
                        this.handleJump();
                        this.hideHints();
                    } else if (deltaY > this.minSwipeDistance) {
                        this.handleSlide();
                        this.hideHints();
                    }
                } else {
                    const tapY = this.touchStartY;
                    const screenHeight = this.canvas.height;

                    if (tapY < screenHeight * 0.5) {
                        this.handleJump();
                        this.hideHints();
                    } else {
                        this.handleSlide();
                        this.hideHints();
                    }
                }
            }, { passive: false });
        }

        document.addEventListener('touchmove', (e) => {
            if (this.state === 'playing') {
                e.preventDefault();
            }
        }, { passive: false });

        // Button handlers
        document.getElementById('btn-play')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.startGame();
        });
        document.getElementById('btn-play-again')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.startGame();
        });
        document.getElementById('pause-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.togglePause();
        });
        document.getElementById('btn-resume')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.togglePause();
        });
        document.getElementById('btn-quit')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.quitGame();
        });
        document.getElementById('btn-share')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.shareScore();
        });
        document.getElementById('sound-toggle')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleSound();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state === 'playing') {
                this.togglePause();
            }
        });
    }

    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    async initPokiSDK() {
        return new Promise((resolve) => {
            const checkSDK = () => {
                if (window.PokiSDK) {
                    this.pokiAvailable = true;
                    window.PokiSDK_init().then(() => {
                        this.pokiSDK = window.PokiSDK;
                        console.log('Poki SDK initialized');
                        resolve();
                    }).catch(() => {
                        console.log('Poki SDK init failed');
                        resolve();
                    });
                } else {
                    setTimeout(checkSDK, 100);
                }
            };
            setTimeout(resolve, 3000);
            checkSDK();
        });
    }

    initBackgroundStars() {
        const starCount = Math.floor(this.canvas.width / 10);
        for (let i = 0; i < starCount; i++) {
            this.starsBackground.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.5 + 0.1,
                brightness: Math.random()
            });
        }
    }

    showLoadingProgress() {
        let progress = 0;
        const progressBar = document.querySelector('.progress-bar');
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    this.showScreen('start-screen');
                    this.state = 'menu';
                    this.renderMenuBackground();
                }, 300);
            }
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
        }, 150);
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId)?.classList.add('active');
    }

    updateHighScoreDisplay() {
        const menuHighScore = document.getElementById('menu-high-score');
        if (menuHighScore) {
            menuHighScore.textContent = this.formatScore(this.highScore);
        }
    }

    formatScore(score) {
        return Math.floor(score).toLocaleString();
    }

    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        switch (type) {
            case 'jump':
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;
            case 'slide':
                oscillator.frequency.setValueAtTime(300, now);
                oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.15);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                oscillator.start(now);
                oscillator.stop(now + 0.15);
                break;
            case 'collect':
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;
            case 'powerup':
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.2);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;
            case 'hit':
                oscillator.frequency.setValueAtTime(200, now);
                oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.2);
                gainNode.gain.setValueAtTime(0.4, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;
            case 'gameover':
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);
                gainNode.gain.setValueAtTime(0.4, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                oscillator.start(now);
                oscillator.stop(now + 0.5);
                break;
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('sound-toggle');
        const icon = document.getElementById('sound-icon');
        if (btn && icon) {
            btn.classList.toggle('muted', !this.soundEnabled);
            icon.innerHTML = this.soundEnabled
                ? '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="#fff"/>'
                : '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="#fff"/>';
        }
    }

    hideHints() {
        if (!this.showHints) return;

        this.hintsShown.jump = true;
        this.hintsShown.slide = true;

        const hintsEl = document.getElementById('control-hints');
        const tutorialEl = document.getElementById('tutorial-overlay');

        if (hintsEl) {
            hintsEl.classList.add('fade-out');
            setTimeout(() => hintsEl.classList.remove('visible'), 500);
        }
        if (tutorialEl) {
            tutorialEl.classList.add('fade-out');
            setTimeout(() => tutorialEl.classList.remove('visible'), 300);
        }

        this.showHints = false;
    }

    showTutorialHint(type) {
        if (!this.showHints) return;

        const tutorialEl = document.getElementById('tutorial-overlay');
        const iconEl = document.getElementById('tutorial-icon');
        const textEl = document.getElementById('tutorial-text');

        if (!tutorialEl || !iconEl || !textEl) return;

        if (type === 'jump' && !this.hintsShown.jump) {
            iconEl.textContent = '↑';
            textEl.textContent = 'TAP TOP / SWIPE UP TO JUMP';
            tutorialEl.classList.add('visible');
            this.hintsShown.jump = true;

            setTimeout(() => {
                tutorialEl.classList.add('fade-out');
                setTimeout(() => {
                    tutorialEl.classList.remove('visible', 'fade-out');
                    this.checkShowSlideHint();
                }, 300);
            }, 2000);
        } else if (type === 'slide' && !this.hintsShown.slide) {
            this.checkShowSlideHint();
        }
    }

    checkShowSlideHint() {
        if (!this.showHints || this.hintsShown.slide) return;

        setTimeout(() => {
            const tutorialEl = document.getElementById('tutorial-overlay');
            const iconEl = document.getElementById('tutorial-icon');
            const textEl = document.getElementById('tutorial-text');

            if (!tutorialEl || !iconEl || !textEl) return;

            iconEl.textContent = '↓';
            textEl.textContent = 'TAP BOTTOM / SWIPE DOWN TO SLIDE';
            tutorialEl.classList.add('visible');
            this.hintsShown.slide = true;

            setTimeout(() => {
                tutorialEl.classList.add('fade-out');
                setTimeout(() => {
                    tutorialEl.classList.remove('visible', 'fade-out');
                }, 300);
            }, 2000);
        }, 500);
    }

    startGame() {
        this.score = 0;
        this.distance = 0;
        this.starsCollected = 0;
        this.gameSpeed = this.baseSpeed;
        this.difficultyLevel = 1;
        this.difficultyTimer = 0;
        this.obstacles = [];
        this.stars = [];
        this.powerups = [];
        this.particles = [];
        this.powerup = null;
        this.shieldActive = false;
        this.doubleScoreActive = false;
        this.slowMotionActive = false;

        // Reset tutorial hints
        this.showHints = true;
        this.hintsShown = { jump: false, slide: false };

        this.player.y = this.groundY - this.player.height;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.isSliding = false;
        this.player.slideTimer = 0;
        this.player.rotation = 0;
        this.player.height = this.player.originalHeight;

        this.showScreen('game-screen');
        document.getElementById('current-score').textContent = '0';
        document.getElementById('powerup-indicator')?.classList.remove('active');

        // Show control hints at start
        const hintsEl = document.getElementById('control-hints');
        if (hintsEl) {
            hintsEl.classList.remove('visible', 'fade-out');
            setTimeout(() => hintsEl.classList.add('visible'), 100);
        }

        this.state = 'playing';
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);

        // Show jump tutorial after a short delay
        setTimeout(() => {
            if (this.state === 'playing' && this.showHints) {
                this.showTutorialHint('jump');
            }
        }, 1000);

        if (this.pokiSDK) {
            window.PokiSDK_gameStart();
        }
    }

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.showScreen('pause-screen');
            if (this.pokiSDK) {
                window.PokiSDK_gameStop();
            }
        } else if (this.state === 'paused') {
            this.state = 'playing';
            this.showScreen('game-screen');
            this.lastTime = performance.now();
            this.gameLoop(this.lastTime);
            if (this.pokiSDK) {
                window.PokiSDK_gameStart();
            }
        }
    }

    quitGame() {
        this.state = 'menu';
        this.showScreen('start-screen');
        this.updateHighScoreDisplay();
    }

    shareScore() {
        const text = `I scored ${this.formatScore(this.score)} in Cosmic Runner! Can you beat my score?`;
        if (navigator.share) {
            navigator.share({
                title: 'Cosmic Runner',
                text: text,
                url: window.location.href
            }).catch(() => {});
        } else {
            navigator.clipboard?.writeText(text);
            const btn = document.getElementById('btn-share');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<span>COPIED!</span>';
                setTimeout(() => { btn.innerHTML = originalText; }, 1500);
            }
        }
    }

    handleJump() {
        if (!this.player.isJumping && !this.player.isSliding) {
            this.player.velocityY = this.player.jumpForce;
            this.player.isJumping = true;
            this.playSound('jump');

            for (let i = 0; i < 10; i++) {
                this.particles.push({
                    x: this.player.x + this.player.width / 2,
                    y: this.player.y + this.player.height,
                    vx: (Math.random() - 0.5) * 4,
                    vy: Math.random() * 2,
                    life: 1,
                    color: '#00d9ff',
                    size: Math.random() * 4 + 2
                });
            }
        } else if (this.player.isJumping) {
            this.player.velocityY = Math.abs(this.player.jumpForce) * 0.8;
        }
    }

    handleSlide() {
        if (!this.player.isSliding && !this.player.isJumping) {
            this.player.isSliding = true;
            this.player.height = this.player.slideHeight;
            this.player.y = this.groundY - this.player.height;
            this.slideTimer = 40;
            this.playSound('slide');

            for (let i = 0; i < 8; i++) {
                this.particles.push({
                    x: this.player.x + this.player.width / 2,
                    y: this.player.y + this.player.height,
                    vx: -Math.random() * 3 - 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 1,
                    color: '#7b2cbf',
                    size: Math.random() * 3 + 1
                });
            }
        } else if (this.player.isJumping) {
            this.player.velocityY = Math.abs(this.player.jumpForce) * 0.8;
        }
    }

    spawnObstacle() {
        // EASIER: More ground obstacles, fewer air obstacles at low difficulty
        let types;
        if (this.difficultyLevel <= 3) {
            types = ['ground', 'ground', 'ground']; // Only ground obstacles at start
        } else if (this.difficultyLevel <= 5) {
            types = ['ground', 'ground', 'ground', 'air']; // Introduce air obstacles
        } else if (this.difficultyLevel <= 7) {
            types = ['ground', 'ground', 'ground', 'air', 'air'];
        } else {
            types = ['ground', 'ground', 'ground', 'air', 'air', 'tall']; // Tall obstacles at high difficulty
        }

        const type = types[Math.floor(Math.random() * types.length)];
        const scaleRatio = this.canvas.height / this.baseHeight;

        let obstacle = { x: this.canvas.width + 100, type };

        switch (type) {
            case 'ground':
                obstacle.width = (40 + Math.random() * 20) * scaleRatio; // Smaller obstacles
                obstacle.height = (40 + Math.random() * 15) * scaleRatio;
                obstacle.y = this.groundY - obstacle.height;
                obstacle.color = '#ff006e';
                break;
            case 'air':
                obstacle.width = 50 * scaleRatio;
                obstacle.height = 50 * scaleRatio;
                obstacle.y = this.groundY - (100 * scaleRatio) - Math.random() * (30 * scaleRatio);
                obstacle.color = '#ff6b6b';
                break;
            case 'tall':
                obstacle.width = 35 * scaleRatio;
                obstacle.height = 80 * scaleRatio;
                obstacle.y = this.groundY - obstacle.height;
                obstacle.color = '#c9184a';
                break;
        }

        this.obstacles.push(obstacle);
    }

    spawnStar() {
        const patterns = ['line', 'arc', 'scattered'];
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        const scaleRatio = this.canvas.height / this.baseHeight;

        switch (pattern) {
            case 'line':
                for (let i = 0; i < 5; i++) {
                    this.stars.push({
                        x: this.canvas.width + 50 + i * 40 * scaleRatio,
                        y: this.groundY - (80 * scaleRatio) - Math.random() * (80 * scaleRatio),
                        size: 20 * scaleRatio,
                        collected: false,
                        rotation: Math.random() * Math.PI * 2
                    });
                }
                break;
            case 'arc':
                for (let i = 0; i < 7; i++) {
                    this.stars.push({
                        x: this.canvas.width + 50 + i * 35 * scaleRatio,
                        y: this.groundY - (80 * scaleRatio) - Math.sin(i * 0.5) * (50 * scaleRatio),
                        size: 20 * scaleRatio,
                        collected: false,
                        rotation: Math.random() * Math.PI * 2
                    });
                }
                break;
            case 'scattered':
                for (let i = 0; i < 4; i++) {
                    this.stars.push({
                        x: this.canvas.width + 50 + Math.random() * (120 * scaleRatio),
                        y: this.groundY - (60 * scaleRatio) - Math.random() * (100 * scaleRatio),
                        size: 20 * scaleRatio,
                        collected: false,
                        rotation: Math.random() * Math.PI * 2
                    });
                }
                break;
        }
    }

    spawnPowerup() {
        const types = ['shield', 'double', 'slow'];
        const type = types[Math.floor(Math.random() * types.length)];
        const scaleRatio = this.canvas.height / this.baseHeight;

        this.powerups.push({
            x: this.canvas.width + 50,
            y: this.groundY - (80 * scaleRatio) - Math.random() * (60 * scaleRatio),
            type: type,
            size: 30 * scaleRatio,
            collected: false
        });
    }

    updatePlayer() {
        this.player.velocityY += this.player.gravity;
        this.player.y += this.player.velocityY;

        if (this.player.y >= this.groundY - this.player.height) {
            this.player.y = this.groundY - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }

        if (this.player.isSliding) {
            this.slideTimer--;
            if (this.slideTimer <= 0) {
                this.player.isSliding = false;
                this.player.height = this.player.originalHeight;
                this.player.y = this.groundY - this.player.height;
            }
        }

        if (this.player.isJumping) {
            this.player.rotation += 0.15;
        } else {
            this.player.rotation = 0;
        }
    }

    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.gameSpeed;

            if (obs.x + obs.width < -50) {
                this.obstacles.splice(i, 1);
                continue;
            }

            if (this.checkCollision(this.player, obs)) {
                if (this.shieldActive) {
                    this.shieldActive = false;
                    this.obstacles.splice(i, 1);
                    this.playSound('powerup');

                    for (let j = 0; j < 20; j++) {
                        this.particles.push({
                            x: obs.x + obs.width / 2,
                            y: obs.y + obs.height / 2,
                            vx: (Math.random() - 0.5) * 8,
                            vy: (Math.random() - 0.5) * 8,
                            life: 1,
                            color: '#00d9ff',
                            size: Math.random() * 5 + 2
                        });
                    }
                } else {
                    this.gameOver();
                }
            }
        }

        // Spawn obstacles - SLOWER progression
        this.obstacleTimer--;
        if (this.obstacleTimer <= 0) {
            this.spawnObstacle();
            const scaleRatio = this.canvas.height / this.baseHeight;
            // More generous timing between obstacles
            const baseTimer = 80 + (this.difficultyLevel * 5);
            this.obstacleTimer = (baseTimer + Math.random() * 40) / scaleRatio;
        }
    }

    updateStars() {
        for (let i = this.stars.length - 1; i >= 0; i--) {
            this.stars[i].x -= this.gameSpeed;
            this.stars[i].rotation += 0.02;

            if (this.stars[i].x + this.stars[i].size < -50) {
                this.stars.splice(i, 1);
                continue;
            }

            const dx = (this.player.x + this.player.width / 2) - (this.stars[i].x + this.stars[i].size / 2);
            const dy = (this.player.y + this.player.height / 2) - (this.stars[i].y + this.stars[i].size / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < (this.player.width + this.stars[i].size) / 2 && !this.stars[i].collected) {
                this.stars[i].collected = true;
                this.score += this.doubleScoreActive ? 20 : 10;
                this.starsCollected++;
                this.playSound('collect');

                for (let j = 0; j < 8; j++) {
                    this.particles.push({
                        x: this.stars[i].x + this.stars[i].size / 2,
                        y: this.stars[i].y + this.stars[i].size / 2,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        life: 1,
                        color: '#ffd700',
                        size: Math.random() * 4 + 2
                    });
                }

                this.stars.splice(i, 1);
            }
        }

        this.starTimer--;
        if (this.starTimer <= 0) {
            this.spawnStar();
            this.starTimer = 80 + Math.random() * 60;
        }
    }

    updatePowerups() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            this.powerups[i].x -= this.gameSpeed;

            if (this.powerups[i].x + this.powerups[i].size < -50) {
                this.powerups.splice(i, 1);
                continue;
            }

            const dx = (this.player.x + this.player.width / 2) - (this.powerups[i].x + this.powerups[i].size / 2);
            const dy = (this.player.y + this.player.height / 2) - (this.powerups[i].y + this.powerups[i].size / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < (this.player.width + this.powerups[i].size) / 2 && !this.powerups[i].collected) {
                this.powerups[i].collected = true;
                this.activatePowerup(this.powerups[i].type);
                this.playSound('powerup');
                this.powerups.splice(i, 1);
            }
        }

        this.powerupTimerSpawn--;
        if (this.powerupTimerSpawn <= 0) {
            this.spawnPowerup();
            this.powerupTimerSpawn = 400 + Math.random() * 400; // More frequent powerups
        }
    }

    activatePowerup(type) {
        switch (type) {
            case 'shield':
                this.shieldActive = true;
                this.powerup = 'shield';
                this.powerupTimer = 600;
                break;
            case 'double':
                this.doubleScoreActive = true;
                this.powerup = 'double';
                this.powerupTimer = 480;
                break;
            case 'slow':
                this.slowMotionActive = true;
                this.powerup = 'slow';
                this.powerupTimer = 360;
                break;
        }
        document.getElementById('powerup-indicator')?.classList.add('active');
    }

    updatePowerupTimer() {
        if (this.powerupTimer > 0) {
            this.powerupTimer--;
            const maxTime = this.powerup === 'shield' ? 600 : this.powerup === 'double' ? 480 : 360;
            const percent = (this.powerupTimer / maxTime) * 100;
            const timerBar = document.querySelector('.powerup-timer-fill');
            if (timerBar) {
                timerBar.style.width = percent + '%';
            }
            if (this.powerupTimer <= 0) {
                this.shieldActive = false;
                this.doubleScoreActive = false;
                this.slowMotionActive = false;
                this.powerup = null;
                document.getElementById('powerup-indicator')?.classList.remove('active');
            }
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            p.vy += 0.1;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateBackground() {
        for (const star of this.starsBackground) {
            star.x -= star.speed * (this.gameSpeed * 0.1);
            if (star.x < 0) {
                star.x = this.canvas.width;
                star.y = Math.random() * this.canvas.height;
            }
        }
    }

    checkCollision(player, obstacle) {
        // More generous hitbox
        const padding = Math.max(6, this.player.width * 0.2);
        return (
            player.x + padding < obstacle.x + obstacle.width &&
            player.x + player.width - padding > obstacle.x &&
            player.y + padding < obstacle.y + obstacle.height &&
            player.y + player.height - padding > obstacle.y
        );
    }

    updateDifficulty() {
        this.difficultyTimer++;

        // Increase difficulty every 5 seconds (300 frames at 60fps)
        if (this.difficultyTimer >= 300 && this.difficultyLevel < this.maxDifficulty) {
            this.difficultyLevel++;
            this.difficultyTimer = 0;

            // Gradually increase speed
            this.gameSpeed = this.baseSpeed + (this.difficultyLevel - 1) * 0.5;
        }
    }

    updateScore() {
        this.distance += this.gameSpeed * 0.01;
        this.score += this.doubleScoreActive ? 0.02 : 0.01;

        if (this.slowMotionActive) {
            this.gameSpeed *= 0.5;
        }

        document.getElementById('current-score').textContent = this.formatScore(this.score);
    }

    gameOver() {
        this.state = 'gameover';
        this.playSound('gameover');

        const isNewHighScore = this.score > this.highScore;
        if (isNewHighScore) {
            this.highScore = this.score;
            localStorage.setItem('cosmicRunnerHighScore', this.highScore);
        }

        document.getElementById('final-score').textContent = this.formatScore(this.score);
        document.getElementById('stat-distance').textContent = Math.floor(this.distance) + 'm';
        document.getElementById('stat-stars').textContent = this.starsCollected;
        document.getElementById('stat-best').textContent = this.formatScore(this.highScore);

        const newHighScoreEl = document.getElementById('new-high-score');
        if (newHighScoreEl) {
            newHighScoreEl.classList.toggle('show', isNewHighScore);
        }

        this.showScreen('gameover-screen');

        if (this.pokiSDK) {
            window.PokiSDK_gameStop();
        }
    }

    renderMenuBackground() {
        this.ctx.fillStyle = '#050510';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const star of this.starsBackground) {
            star.x -= star.speed * 0.5;
            if (star.x < 0) {
                star.x = this.canvas.width;
                star.y = Math.random() * this.canvas.height;
            }
            const brightness = 0.3 + Math.sin(Date.now() * 0.003 + star.brightness * 10) * 0.3;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        if (this.state === 'menu') {
            requestAnimationFrame(() => this.renderMenuBackground());
        }
    }

    render() {
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Background stars
        for (const star of this.starsBackground) {
            const brightness = 0.3 + Math.sin(Date.now() * 0.003 + star.brightness * 10) * 0.3;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Ground
        const groundGradient = this.ctx.createLinearGradient(0, this.groundY - 50, 0, this.groundY);
        groundGradient.addColorStop(0, '#1a1a2e');
        groundGradient.addColorStop(1, '#0f0f1a');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.groundY - 50, this.canvas.width, 50);

        // Ground line
        this.ctx.strokeStyle = '#00d9ff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY - 50);
        this.ctx.lineTo(this.canvas.width, this.groundY - 50);
        this.ctx.stroke();

        // Obstacles
        for (const obs of this.obstacles) {
            this.ctx.save();
            this.ctx.fillStyle = obs.color;
            this.ctx.shadowColor = obs.color;
            this.ctx.shadowBlur = 20;
            this.ctx.beginPath();
            this.ctx.moveTo(obs.x + 5, obs.y);
            this.ctx.lineTo(obs.x + obs.width - 5, obs.y);
            this.ctx.lineTo(obs.x + obs.width, obs.y + 5);
            this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height - 5);
            this.ctx.lineTo(obs.x + obs.width - 5, obs.y + obs.height);
            this.ctx.lineTo(obs.x + 5, obs.y + obs.height);
            this.ctx.lineTo(obs.x, obs.y + obs.height - 5);
            this.ctx.lineTo(obs.x, obs.y + 5);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
        }

        // Stars
        for (const star of this.stars) {
            this.ctx.save();
            this.ctx.translate(star.x + star.size / 2, star.y + star.size / 2);
            this.ctx.rotate(star.rotation);
            this.ctx.fillStyle = '#ffd700';
            this.ctx.shadowColor = '#ffd700';
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const x = Math.cos(angle) * star.size / 2;
                const y = Math.sin(angle) * star.size / 2;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
        }

        // Powerups
        for (const p of this.powerups) {
            this.ctx.save();
            this.ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
            let color, symbol;
            switch (p.type) {
                case 'shield': color = '#00d9ff'; symbol = '🛡️'; break;
                case 'double': color = '#00ff88'; symbol = '2x'; break;
                case 'slow': color = '#7b2cbf'; symbol = '⏱️'; break;
            }
            this.ctx.fillStyle = color;
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 20;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#fff';
            this.ctx.font = `${p.size * 0.6}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(symbol, 0, 0);
            this.ctx.restore();
        }

        // Player
        this.ctx.save();
        this.ctx.translate(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        this.ctx.rotate(this.player.rotation);

        if (this.shieldActive) {
            this.ctx.shadowColor = '#00d9ff';
            this.ctx.shadowBlur = 30;
        } else if (this.doubleScoreActive) {
            this.ctx.shadowColor = '#00ff88';
            this.ctx.shadowBlur = 30;
        } else if (this.slowMotionActive) {
            this.ctx.shadowColor = '#7b2cbf';
            this.ctx.shadowBlur = 30;
        }

        const playerGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.player.width / 2);
        playerGradient.addColorStop(0, '#00ffff');
        playerGradient.addColorStop(1, '#0066ff');
        this.ctx.fillStyle = playerGradient;

        const w = this.player.width;
        const h = this.player.height;
        const r = w * 0.2;
        this.ctx.beginPath();
        this.ctx.moveTo(-w/2 + r, -h/2);
        this.ctx.lineTo(w/2 - r, -h/2);
        this.ctx.quadraticCurveTo(w/2 - r/2, -h/2, w/2, -h/2 + r);
        this.ctx.lineTo(w/2, h/2 - r);
        this.ctx.quadraticCurveTo(w/2 - r/2, h/2, w/2 - r, h/2);
        this.ctx.lineTo(-w/2 + r, h/2);
        this.ctx.quadraticCurveTo(-w/2 + r/2, h/2, -w/2, h/2 - r);
        this.ctx.lineTo(-w/2, -h/2 + r);
        this.ctx.quadraticCurveTo(-w/2 + r/2, -h/2, -w/2 + r, -h/2);
        this.ctx.closePath();
        this.ctx.fill();

        // Eyes
        this.ctx.fillStyle = '#fff';
        this.ctx.shadowBlur = 0;
        this.ctx.beginPath();
        this.ctx.arc(-w/6, -h/8, w * 0.12, 0, Math.PI * 2);
        this.ctx.arc(w/6, -h/8, w * 0.12, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(-w/6 + w * 0.04, -h/8, w * 0.06, 0, Math.PI * 2);
        this.ctx.arc(w/6 + w * 0.04, -h/8, w * 0.06, 0, Math.PI * 2);
        this.ctx.fill();

        // Shield
        if (this.shieldActive) {
            this.ctx.strokeStyle = '#00d9ff';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.player.width / 2 + 10, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.restore();

        // Particles
        for (const p of this.particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        // Speed lines
        if (this.gameSpeed > 10) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 1;
            for (let i = 0; i < 10; i++) {
                const y = (Date.now() / 2 + i * 50) % this.canvas.height;
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(100 + Math.random() * 100, y);
                this.ctx.stroke();
            }
        }
    }

    gameLoop(currentTime) {
        if (this.state !== 'playing') return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.updatePlayer();
        this.updateObstacles();
        this.updateStars();
        this.updatePowerups();
        this.updateParticles();
        this.updateBackground();
        this.updatePowerupTimer();
        this.updateDifficulty();
        this.updateScore();
        this.render();

        requestAnimationFrame(this.gameLoop);
    }
}

// Start when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new CosmicRunner();
});
