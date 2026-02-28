# Cosmic Runner - Game Design Document

## 🎮 Game Overview

**Cosmic Runner** is an endless runner game designed specifically for the Poki platform. It combines simple, addictive gameplay with beautiful space-themed visuals.

## 🎯 Core Game Loop

```
Run → Dodge → Collect → Die → Restart → (Repeat)
```

### Why It's Addictive

1. **Instant Restart** - No loading screens, immediate retry
2. **Short Sessions** - Each run is 30 seconds to 2 minutes
3. **Progressive Challenge** - Gradually increases difficulty
4. **Random Elements** - Each run feels different
5. **High Score Chase** - Always want to beat your best

## 🎨 Visual Design

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Cyan | #00d9ff | Player, shield power-up |
| Secondary Purple | #7b2cbf | UI elements, slow power-up |
| Accent Pink | #ff006e | Obstacles, game over |
| Success Green | #00ff88 | Double score power-up |
| Gold | #ffd700 | Stars, collectibles |
| Dark BG | #0a0a1a | Game background |
| Darker BG | #050510 | UI backgrounds |

### Visual Effects

1. **Glow Effects** - Neon-style glow on all elements
2. **Particle Systems** - Jump, slide, collect, hit effects
3. **Speed Lines** - Visual feedback for high speed
4. **Rotation Animation** - Player rotates while jumping
5. **Pulsing Power-ups** - Attract attention
6. **Twinkling Stars** - Dynamic background

## 🕹️ Gameplay Mechanics

### Player Actions

| Action | Input | Result |
|--------|-------|--------|
| Jump | Tap top / ↑ | Avoid ground obstacles |
| Fast Fall | Tap top while jumping | Quick descent |
| Slide | Tap bottom / ↓ | Avoid air obstacles |
| Pause | ESC / Pause button | Stop game |

### Obstacle Types

1. **Ground Obstacles** (Red/Pink)
   - Width: 50-80px
   - Height: 50-70px
   - Must jump over

2. **Air Obstacles** (Light Red)
   - Width: 60px
   - Height: 60px
   - Floating, must slide under or avoid

3. **Tall Obstacles** (Dark Pink)
   - Width: 40px
   - Height: 100px
   - Must jump over at right timing

### Power-ups

#### 🛡️ Shield (Blue)
- **Duration:** 10 seconds
- **Effect:** Absorbs one hit
- **Visual:** Blue aura around player

#### 2️⃣ Double Score (Green)
- **Duration:** 8 seconds
- **Effect:** 2x points from all sources
- **Visual:** Green glow

#### ⏱️ Slow Motion (Purple)
- **Duration:** 6 seconds
- **Effect:** 50% game speed
- **Visual:** Purple trail

## 📊 Difficulty Progression

### Speed Curve

```
Base Speed: 5
Formula: speed = 5 + (difficulty * 2)
difficulty increases by 0.001 per frame
```

### Spawn Rates

| Object | Base Interval | Variation |
|--------|--------------|-----------|
| Obstacles | 60-120 frames | ±30 frames |
| Stars | 100-200 frames | ±50 frames |
| Power-ups | 300-600 frames | ±150 frames |

### Difficulty Scaling

As score increases:
- Game speed increases (max ~15)
- Obstacle spawn rate increases
- Obstacle patterns become more complex
- Less time between obstacles

## 🏆 Scoring System

### Points Breakdown

| Action | Base Points | With 2x |
|--------|-------------|---------|
| Running (per second) | ~60 | ~120 |
| Star collected | 10 | 20 |
| Power-up collected | 20 | 40 |

### Score Display

- Real-time score in HUD
- Formatted with commas (1,234)
- Final score shown at game over
- High score persisted in localStorage

## 🔊 Audio Design

### Sound Effects (Web Audio API)

All sounds are synthesized, no external files needed:

1. **Jump** - Rising pitch (400→600Hz)
2. **Slide** - Falling pitch (300→200Hz)
3. **Collect** - High rising chime (800→1200Hz)
4. **Power-up** - Ascending tone (400→800Hz)
5. **Hit** - Descending thud (200→100Hz)
6. **Game Over** - Long descent (400→100Hz)

### Audio Settings

- Toggle on/off button
- Default: ON
- Remembers preference in session

## 📱 Mobile Optimization

### Touch Controls

- **Top 50%** of screen → Jump
- **Bottom 50%** of screen → Slide
- Large touch zones for easy input
- No precision required

### Performance

- Target: 60 FPS on all devices
- Responsive canvas sizing
- Efficient particle cleanup
- Minimal DOM manipulation

### Orientation

- Works in portrait and landscape
- UI adapts to screen orientation
- No forced rotation (user's choice)

## 🎯 Why This Game Succeeds on Poki

### 1. Instant Understanding
- Runner genre is universally known
- 3 seconds to learn controls
- No tutorial needed

### 2. Hard to Master
- Timing-based gameplay
- Progressive difficulty
- Random obstacle patterns

### 3. Satisfying Feedback
- Visual particles on every action
- Sound effects for feedback
- Score constantly increasing

### 4. "One More Try" Factor
- Quick restart
- Clear cause of failure
- Always feel like you can improve

### 5. Universal Appeal
- Space theme is neutral
- No violence or inappropriate content
- All ages can play

## 📈 Analytics Potential

If analytics were added:

- Track average session length
- Track average score
- Track most common death cause
- Track power-up usage rate
- A/B test obstacle frequency

## 🔮 Future Expansion Ideas

### Potential Additions

1. **Multiple Characters** - Different abilities
2. **Daily Challenges** - Special objectives
3. **Achievements** - Long-term goals
4. **Leaderboards** - Compete globally
5. **Skins** - Visual customization
6. **World Themes** - Different backgrounds
7. **Special Events** - Limited-time modes

## 🎓 Lessons from Popular Poki Games

### Subway Surfers
- ✅ Endless running is proven popular
- ✅ Simple controls (swipe)
- ✅ Collectible items

### Temple Run
- ✅ Risk/reward mechanics
- ✅ Increasing tension

### Geometry Dash
- ✅ Rhythm-based movement
- ✅ Visual feedback

### Our Implementation
- ✅ Combined best elements
- ✅ Simplified for instant play
- ✅ Optimized for mobile-first

---

**This game is designed to maximize:**
- Session count
- Return rate
- Share rate
- Overall engagement
