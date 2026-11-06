(function () {
      'use strict';

      // =========================================================================
      // 1. WEB AUDIO API DISNEY BOUNCY FLUTE & ORCHESTRAL SOUNDTRACK ENGINE
      // =========================================================================
      class SoundEngine {
        constructor() {
          this.ctx = null;
          this.output = null;
          this.enabled = true;
          this.musicPlaying = false;
          this.stepIndex = 0;
          this.musicTimer = null;
          this.noiseBuffer = null;
        }

        init() {
          if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
              this.ctx = new AudioCtx();
              this.output = this.ctx.createGain();
              this.output.connect(this.ctx.destination);
              // Create breath chiff noise buffer for realistic Disney flute articulation
              const sr = this.ctx.sampleRate;
              const len = Math.floor(sr * 0.08);
              this.noiseBuffer = this.ctx.createBuffer(1, len, sr);
              const data = this.noiseBuffer.getChannelData(0);
              for (let i = 0; i < len; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.018));
              }
            }
          }
          if (this.ctx && this.ctx.state === 'suspended') {
            void this.ctx.resume().catch(() => {});
          }
        }

        toggle() {
          this.init();
          this.enabled = !this.enabled;
          if (this.output) this.output.gain.value = Number(this.enabled);
          return this.enabled;
        }

        // Bouncy Disney-style Concert / Piccolo Flute with breath chiff, grace-note bounce & vibrato
        playDisneyFlute(freq, duration = 0.19, vol = 0.085, delay = 0, graceFreq = null) {
          if (!this.enabled || !this.ctx) return;
          const now = this.ctx.currentTime + delay;

          // 1. Main Flute Body (Pure Sine + Soft Octave Triangle Harmonic)
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain1 = this.ctx.createGain();
          const gain2 = this.ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'triangle';

          if (graceFreq) {
            // Bouncy grace-note ("flauta saltarina" articulation)
            osc1.frequency.setValueAtTime(graceFreq, now);
            osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.032);
            osc2.frequency.setValueAtTime(graceFreq * 2, now);
            osc2.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.032);
          } else {
            osc1.frequency.setValueAtTime(freq * 0.992, now);
            osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.02);
            osc2.frequency.setValueAtTime(freq * 2, now);
          }

          // Expressive Flute Vibrato LFO
          const lfo = this.ctx.createOscillator();
          const lfoGain = this.ctx.createGain();
          lfo.frequency.setValueAtTime(5.8, now);
          lfoGain.gain.setValueAtTime(freq * 0.008, now);
          lfo.connect(lfoGain);
          lfoGain.connect(osc1.frequency);

          // Bouncy Flute Envelope
          gain1.gain.setValueAtTime(0.0001, now);
          gain1.gain.linearRampToValueAtTime(vol, now + 0.022);
          gain1.gain.exponentialRampToValueAtTime(vol * 0.65, now + duration * 0.65);
          gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

          gain2.gain.setValueAtTime(0.0001, now);
          gain2.gain.linearRampToValueAtTime(vol * 0.22, now + 0.02);
          gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.85);

          osc1.connect(gain1);
          osc2.connect(gain2);
          gain1.connect(this.output);
          gain2.connect(this.output);

          osc1.start(now);
          osc2.start(now);
          lfo.start(now);
          osc1.stop(now + duration + 0.02);
          osc2.stop(now + duration + 0.02);
          lfo.stop(now + duration + 0.02);

          // 2. Subtle Breath Chiff on Flute Attack
          if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(Math.min(4800, freq * 2.5), now);
            filter.Q.setValueAtTime(3.5, now);
            const nGain = this.ctx.createGain();
            nGain.gain.setValueAtTime(vol * 0.26, now);
            nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(this.output);
            noise.start(now);
            noise.stop(now + 0.04);
          }
        }

        // Orchestral Pizzicato Strings (Bouncy Disney Fairytale Accompaniment)
        playPizzicato(freq, vol = 0.055, delay = 0) {
          if (!this.enabled || !this.ctx) return;
          this.playTone(freq, 'triangle', 0.11, vol, freq * 0.98, delay);
          this.playTone(freq * 2, 'sine', 0.06, vol * 0.35, null, delay);
        }

        // Sparkling Disney Celesta / Glockenspiel Chime
        playCelesta(freq, vol = 0.04, delay = 0) {
          if (!this.enabled || !this.ctx) return;
          this.playTone(freq, 'sine', 0.28, vol, null, delay);
          this.playTone(freq * 2.756, 'sine', 0.12, vol * 0.25, null, delay);
        }

        playTone(freq, type, duration, vol = 0.12, slideTo = null, delay = 0) {
          if (!this.enabled || !this.ctx) return;
          const now = this.ctx.currentTime + delay;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, now);
          if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
          }
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(vol, now + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
          osc.connect(gain);
          gain.connect(this.output);
          osc.start(now);
          osc.stop(now + duration + 0.02);
        }

        sfxJump(isDouble = false) {
          this.init();
          if (!isDouble) {
            this.playDisneyFlute(523.25, 0.15, 0.11, 0, 392.00);
            this.playDisneyFlute(659.25, 0.16, 0.09, 0.04, 523.25);
          } else {
            this.playDisneyFlute(659.25, 0.13, 0.11, 0, 523.25);
            this.playDisneyFlute(783.99, 0.14, 0.10, 0.04, 659.25);
            this.playDisneyFlute(1046.50, 0.18, 0.10, 0.08, 783.99);
          }
        }

        sfxDragonflyBuzz() {
          this.init();
          this.playTone(195, 'sawtooth', 0.14, 0.06, 260);
          this.playTone(780, 'triangle', 0.12, 0.05, 980, 0.03);
        }

        sfxDragonflySwoop() {
          this.init();
          this.playTone(620, 'sawtooth', 0.24, 0.075, 180);
          this.playTone(940, 'sine', 0.20, 0.06, 290, 0.02);
        }

        sfxDodgePerfect() {
          this.init();
          this.playDisneyFlute(880, 0.14, 0.10, 0, 659.25);
          this.playDisneyFlute(1174.66, 0.18, 0.10, 0.05, 880);
        }

        sfxVineGrab() {
          this.init();
          this.playTone(260, 'triangle', 0.14, 0.12, 420);
          this.playTone(390, 'sine', 0.16, 0.09, 520, 0.04);
        }

        sfxVineLaunch() {
          this.init();
          this.playDisneyFlute(587.33, 0.18, 0.12, 0, 440);
          this.playDisneyFlute(880.00, 0.22, 0.11, 0.05, 587.33);
        }

        sfxSplash() {
          this.init();
          this.playTone(180, 'sawtooth', 0.18, 0.10, 65);
          this.playTone(340, 'sine', 0.22, 0.12, 140, 0.03);
          this.playTone(520, 'triangle', 0.16, 0.08, 220, 0.07);
        }

        sfxCrocSnap() {
          this.init();
          this.playTone(150, 'square', 0.09, 0.12, 55);
          this.playTone(95, 'sawtooth', 0.11, 0.12, 45, 0.03);
        }

        sfxStep() {
          if (!this.enabled || !this.ctx) return;
          this.playTone(130 + Math.random() * 35, 'triangle', 0.045, 0.035, 75);
        }

        sfxNote() {
          this.init();
          const scale = [523.25, 587.33, 659.25, 783.99, 1046.5];
          const f = scale[Math.floor(Math.random() * scale.length)];
          this.playDisneyFlute(f, 0.22, 0.12, 0, f * 0.89);
          this.playCelesta(f * 2, 0.05, 0.04);
        }

        sfxClef() {
          this.init();
          const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
          notes.forEach((n, idx) => {
            this.playDisneyFlute(n, 0.28, 0.12, idx * 0.065, n * 0.84);
            this.playCelesta(n * 1.5, 0.05, idx * 0.065);
          });
        }

        sfxWave() {
          this.init();
          this.playDisneyFlute(659.25, 0.22, 0.11, 0, 440);
          this.playDisneyFlute(987.77, 0.24, 0.09, 0.04, 659.25);
          this.playCelesta(1318.5, 0.06, 0.06);
        }

        sfxDash() {
          this.init();
          this.playTone(280, 'sawtooth', 0.12, 0.06, 120);
          this.playDisneyFlute(783.99, 0.15, 0.09, 0.02, 523.25);
        }

        sfxBounce() {
          this.init();
          this.playTone(196, 'sine', 0.28, 0.18, 587.33);
          this.playDisneyFlute(784, 0.22, 0.10, 0.03, 392);
        }

        sfxEnemyStomp() {
          this.init();
          this.playTone(220, 'square', 0.1, 0.1, 110);
          this.playDisneyFlute(783.99, 0.2, 0.12, 0.04, 523.25);
        }

        sfxHurt() {
          this.init();
          this.playTone(240, 'sawtooth', 0.22, 0.13, 110);
          this.playTone(180, 'sawtooth', 0.26, 0.11, 85, 0.08);
        }

        sfxCheckpoint() {
          this.init();
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
            this.playDisneyFlute(f, 0.24, 0.11, i * 0.07, f * 0.89);
          });
        }

        sfxVictory() {
          this.init();
          const fanfare = [
            { f: 523.25, d: 0.18, t: 0.0 },
            { f: 659.25, d: 0.18, t: 0.14 },
            { f: 783.99, d: 0.18, t: 0.28 },
            { f: 1046.5, d: 0.42, t: 0.42 },
            { f: 880.0,  d: 0.18, t: 0.78 },
            { f: 1046.5, d: 0.65, t: 0.96 }
          ];
          fanfare.forEach(n => {
            this.playDisneyFlute(n.f, n.d, 0.14, n.t, n.f * 0.89);
            this.playCelesta(n.f * 1.5, 0.06, n.t);
            this.playPizzicato(n.f * 0.5, 0.08, n.t);
          });
        }

        startIntroMusic() {
          this.init();
          if (!this.ctx || this.musicPlaying) return;
          this.musicPlaying = true;
          this.output.gain.value = 1;
          this.stepIndex = 0;

          // Obertura de fantasía con flauta, pizzicato y celesta.
          const l1Flute = [
            523.25, 659.25, 783.99, 1046.50, 987.77, 1046.50, 783.99, 659.25,
            587.33, 698.46, 880.00, 783.99,  659.25, 783.99,  587.33, 523.25,
            659.25, 783.99, 880.00, 1046.50, 1174.66, 1046.50, 880.00, 783.99,
            698.46, 659.25, 587.33, 659.25,  783.99, 1046.50, 783.99, 523.25
          ];
          const l1Bass = [261.63, 392.00, 261.63, 392.00, 293.66, 440.00, 196.00, 392.00];

          const tempoMs = 175;
          const playStep = () => {
            if (this.ctx.state !== 'running') return;
            const mel = l1Flute;
            const bas = l1Bass;
            const mFreq = mel[this.stepIndex % mel.length];
            const prevFreq = mel[(this.stepIndex - 1 + mel.length) % mel.length];
            const bFreq = bas[Math.floor(this.stepIndex / 2) % bas.length];

            // Play bouncy staccato flute with grace note on every beat!
            const useGrace = (this.stepIndex % 2 === 0);
            const dur = (this.stepIndex % 4 === 3) ? 0.22 : 0.135;
            this.playDisneyFlute(mFreq, dur, 0.075, 0, useGrace ? prevFreq : null);

            // Playful Piccolo Octave Double on upbeat accents ("flautas saltarinas")
            if (this.stepIndex % 4 === 1) {
              this.playDisneyFlute(mFreq * 1.5, 0.09, 0.032, 0.08, mFreq);
            }

            // Orchestral Pizzicato Strings Oom-Pah Bounce
            if (this.stepIndex % 2 === 0) {
              this.playPizzicato(bFreq, 0.055, 0);
            } else {
              this.playPizzicato(bFreq * 1.5, 0.04, 0);
            }

            // Sparkling Disney Celesta Chime on phrase peaks
            if (this.stepIndex % 4 === 0) {
              this.playCelesta(mFreq * 2, 0.03, 0.02);
            }

            this.stepIndex++;
          };
          playStep();
          this.musicTimer = setInterval(playStep, tempoMs);
        }

        stopMusic() {
          this.musicPlaying = false;
          if (this.output) this.output.gain.value = 0;
          if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
          }
        }
      }

      const sound = new SoundEngine();
      const introSound = new SoundEngine();

      // =========================================================================
      // 2. PROCEDURAL PBR TEXTURE GENERATOR (ALBEDO + NORMAL RELIEF + SPECULAR)
      // =========================================================================
      function createPBRMaterial(theme) {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const heightMap = new Float32Array(size * size);
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const nx = (x / size) * Math.PI * 2;
            const ny = (y / size) * Math.PI * 2;
            let h =
              Math.sin(nx * 2) * Math.cos(ny * 2) * 0.35 +
              Math.sin(nx * 5 + ny * 3) * 0.2 +
              Math.cos(nx * 9 - ny * 7) * 0.1;

            const brickRow = Math.floor(y / 32);
            const brickX = (x + (brickRow % 2) * 32) % 64;
            const brickY = y % 32;
            if (brickX < 3 || brickX > 61 || brickY < 3 || brickY > 29) {
              h -= 0.65;
            }
            heightMap[y * size + x] = h;
          }
        }

        const imgData = ctx.createImageData(size, size);
        const data = imgData.data;

        const lx = -0.45, ly = -0.65, lz = 0.61;
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const xPrev = (x - 1 + size) % size;
            const xNext = (x + 1) % size;
            const yPrev = (y - 1 + size) % size;
            const yNext = (y + 1) % size;

            const dX = (heightMap[y * size + xNext] - heightMap[y * size + xPrev]) * 1.8;
            const dY = (heightMap[yNext * size + x] - heightMap[yPrev * size + x]) * 1.8;
            const invLen = 1 / Math.sqrt(dX * dX + dY * dY + 1);
            const nx = -dX * invLen;
            const ny = -dY * invLen;
            const nz = invLen;

            const ndotl = Math.max(0.15, nx * lx + ny * ly + nz * lz);
            const spec = Math.pow(Math.max(0, nz * 0.85 - dX * 0.25 - dY * 0.35), 14);
            const hVal = heightMap[y * size + x];

            let r, g, b;
            if (theme === 'forest_stone') {
              const isMoss = y < 22 + Math.sin(x * 0.15) * 6;
              if (isMoss) {
                r = 46 * ndotl + spec * 90;
                g = 168 * ndotl + spec * 110;
                b = 82 * ndotl + spec * 70;
              } else {
                r = (118 + hVal * 26) * ndotl + spec * 75;
                g = (92 + hVal * 22) * ndotl + spec * 65;
                b = (74 + hVal * 18) * ndotl + spec * 55;
              }
            } else if (theme === 'clockwork_marble') {
              const isGoldVein = Math.abs(Math.sin(x * 0.09 + y * 0.07)) > 0.92 || y < 14;
              if (isGoldVein) {
                r = 235 * ndotl + spec * 140;
                g = 175 * ndotl + spec * 120;
                b = 55 * ndotl + spec * 80;
              } else {
                r = (78 + hVal * 25) * ndotl + spec * 95;
                g = (52 + hVal * 20) * ndotl + spec * 80;
                b = (128 + hVal * 32) * ndotl + spec * 130;
              }
            } else if (theme === 'jungle_ruins') {
              // Deep Mayan Jade-Moss & Carved Jungle Temple Stone with Golden Glyphs
              const isJungleMoss = y < 28 + Math.sin(x * 0.22) * 8;
              const isGlyph = (y > 42 && y < 58 && ((x + 12) % 32 < 8));
              if (isJungleMoss) {
                r = 16 * ndotl + spec * 80;
                g = 185 * ndotl + spec * 130;
                b = 105 * ndotl + spec * 95;
              } else if (isGlyph) {
                r = 245 * ndotl + spec * 140;
                g = 190 * ndotl + spec * 110;
                b = 45 * ndotl + spec * 60;
              } else {
                r = (68 + hVal * 22) * ndotl + spec * 85;
                g = (102 + hVal * 26) * ndotl + spec * 105;
                b = (76 + hVal * 20) * ndotl + spec * 80;
              }
            } else if (theme === 'crystal_cavern') {
              // Subterranean Bioluminescent Crystal Cavern Rock (Obsidian + Cyan/Magenta Crystal Veins)
              const isCyanCrust = y < 24 + Math.sin(x * 0.25) * 7;
              const isCrystalVein = Math.abs(Math.sin(x * 0.11 - y * 0.08)) > 0.90;
              if (isCyanCrust) {
                r = 14 * ndotl + spec * 130;
                g = 195 * ndotl + spec * 165;
                b = 235 * ndotl + spec * 180;
              } else if (isCrystalVein) {
                r = 217 * ndotl + spec * 155;
                g = 70 * ndotl + spec * 110;
                b = 239 * ndotl + spec * 170;
              } else {
                r = (34 + hVal * 18) * ndotl + spec * 90;
                g = (45 + hVal * 22) * ndotl + spec * 115;
                b = (82 + hVal * 28) * ndotl + spec * 145;
              }
            } else {
              const grain = Math.sin(y * 0.45 + Math.sin(x * 0.1) * 2) * 18;
              r = (156 + grain) * ndotl + spec * 60;
              g = (98 + grain * 0.6) * ndotl + spec * 45;
              b = (52 + grain * 0.4) * ndotl + spec * 30;
            }

            const idx = (y * size + x) * 4;
            data[idx] = Math.min(255, Math.max(0, r));
            data[idx + 1] = Math.min(255, Math.max(0, g));
            data[idx + 2] = Math.min(255, Math.max(0, b));
            data[idx + 3] = 255;
          }
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas;
      }

      const pbrMaterials = {
        forest_stone: createPBRMaterial('forest_stone'),
        clockwork_marble: createPBRMaterial('clockwork_marble'),
        jungle_ruins: createPBRMaterial('jungle_ruins'),
        crystal_cavern: createPBRMaterial('crystal_cavern'),
        wood_bridge: createPBRMaterial('wood_bridge')
      };

      // =========================================================================
      // 3. SPRITE LOADER (CLEANED PETRONIA SPRITES)
      // =========================================================================
      const sprites = {
        walk: document.getElementById('sprWalkStrip'),
        front: document.getElementById('sprFront'),
        threeQuarter: document.getElementById('sprThreeQuarter'),
        side: document.getElementById('sprSide'),
        celebrate: document.getElementById('sprCelebrate')
      };

      // =========================================================================
      // 4. LEVEL DESIGN: 3 COMPLETE LEVELS (INCLUDING LEVEL 3 JUNGLE + LIANAS + CROCS + TRAPS)
      // =========================================================================
      function buildLevelData(levelNum) {
        if (levelNum === 1) {
          // LEVEL 1: BOSQUE MELÓDICO DE SPARROWS TALES
          const platforms = [
            { x: -120, y: 460, w: 680, h: 120, mat: 'forest_stone', type: 'ground' },
            { x: 620, y: 420, w: 280, h: 42, mat: 'wood_bridge', type: 'platform' },
            { x: 960, y: 365, w: 250, h: 42, mat: 'forest_stone', type: 'platform' },
            { x: 1270, y: 460, w: 540, h: 120, mat: 'forest_stone', type: 'ground' },
            { x: 1330, y: 250, w: 210, h: 36, mat: 'wood_bridge', type: 'platform' },
            { x: 1860, y: 390, w: 180, h: 36, mat: 'wood_bridge', type: 'moving', vx: 95, minX: 1850, maxX: 2180, minY: 390, maxY: 390 },
            { x: 2420, y: 450, w: 520, h: 130, mat: 'forest_stone', type: 'ground' },
            { x: 2990, y: 380, w: 200, h: 40, mat: 'wood_bridge', type: 'platform' },
            { x: 3250, y: 300, w: 220, h: 40, mat: 'forest_stone', type: 'platform' },
            { x: 3530, y: 230, w: 210, h: 38, mat: 'wood_bridge', type: 'platform' },
            { x: 3520, y: 460, w: 620, h: 120, mat: 'forest_stone', type: 'ground' },
            { x: 4200, y: 400, w: 190, h: 36, mat: 'wood_bridge', type: 'moving', vx: 0, vy: 75, minX: 4200, maxX: 4200, minY: 290, maxY: 430 },
            { x: 4450, y: 330, w: 640, h: 180, mat: 'forest_stone', type: 'ground' }
          ];

          const bouncePads = [
            { x: 1520, y: 442, w: 68, h: 22, power: -730, label: 'Tambor' },
            { x: 2780, y: 432, w: 68, h: 22, power: -730, label: 'Tambor' },
            { x: 4010, y: 442, w: 68, h: 22, power: -750, label: 'Tambor' }
          ];

          const notes = [
            { x: 260, y: 400 }, { x: 330, y: 400 }, { x: 400, y: 400 },
            { x: 690, y: 360 }, { x: 760, y: 340 }, { x: 830, y: 360 },
            { x: 1030, y: 305 }, { x: 1110, y: 305 },
            { x: 1550, y: 330 }, { x: 1510, y: 240 }, { x: 1450, y: 190 },
            { x: 1950, y: 320 }, { x: 2060, y: 300 }, { x: 2170, y: 320 },
            { x: 2540, y: 390 }, { x: 2630, y: 390 }, { x: 2720, y: 390 },
            { x: 3070, y: 320 }, { x: 3340, y: 240 }, { x: 3610, y: 170 },
            { x: 3720, y: 400 }, { x: 3820, y: 400 }, { x: 3920, y: 400 },
            { x: 4540, y: 270 }, { x: 4630, y: 270 }
          ].map((n, idx) => ({ ...n, id: idx, collected: false, phase: idx * 0.5 }));

          const clefs = [
            { x: 1410, y: 185, id: 1, collected: false, hint: 'Sobre el Roble Antiguo' },
            { x: 3635, y: 155, id: 2, collected: false, hint: 'Terraza del Luthier' },
            { x: 4295, y: 215, id: 3, collected: false, hint: 'Ascensor del Arpa' }
          ];

          const enemies = [
            { x: 750, y: 378, baseY: 378, minX: 640, maxX: 870, vx: 85, type: 'beetle', hp: 1, alive: true, stun: 0 },
            { x: 1380, y: 416, baseY: 416, minX: 1300, maxX: 1750, vx: 95, type: 'crow', hp: 1, alive: true, stun: 0 },
            { x: 2560, y: 406, baseY: 406, minX: 2450, maxX: 2880, vx: 115, type: 'beetle', hp: 1, alive: true, stun: 0 },
            { x: 3350, y: 256, baseY: 256, minX: 3260, maxX: 3450, vx: 90, type: 'wasp', hp: 1, alive: true, stun: 0 },
            { x: 3650, y: 416, baseY: 416, minX: 3560, maxX: 3960, vx: 120, type: 'crow', hp: 1, alive: true, stun: 0 },
            { x: 4580, y: 286, baseY: 286, minX: 4480, maxX: 4780, vx: 110, type: 'beetle', hp: 1, alive: true, stun: 0 }
          ];

          const checkpoints = [
            { x: 1310, y: 395, active: false, name: 'Atril del Roble' },
            { x: 2480, y: 385, active: false, name: 'Atril del Puente' },
            { x: 3580, y: 395, active: false, name: 'Atril del Santuario' }
          ];

          return {
            levelNum: 1,
            name: 'Nivel 1: Bosque Melódico',
            worldWidth: 5150,
            skyTop: '#1a103c',
            skyMid: '#3b1d6e',
            skyBot: '#f59e0b',
            platforms,
            bouncePads,
            waterPools: [],
            lianas: [],
            traps: [],
            notes,
            clefs,
            enemies,
            checkpoints,
            goal: {
              x: 4860,
              y: 220,
              w: 110,
              h: 110,
              type: 'portal',
              title: 'Portal al Nivel 2 (Cumbres)'
            }
          };
        } else if (levelNum === 2) {
          // LEVEL 2: CUMBRES DEL RELOJ SINFÓNICO
          const platforms = [
            { x: -120, y: 460, w: 620, h: 120, mat: 'clockwork_marble', type: 'ground' },
            { x: 560, y: 400, w: 220, h: 38, mat: 'clockwork_marble', type: 'platform' },
            { x: 840, y: 350, w: 185, h: 36, mat: 'wood_bridge', type: 'moving', vx: 125, vy: 0, minX: 840, maxX: 1160, minY: 350, maxY: 350 },
            { x: 1400, y: 390, w: 460, h: 130, mat: 'clockwork_marble', type: 'ground' },
            { x: 1480, y: 195, w: 200, h: 36, mat: 'clockwork_marble', type: 'platform' },
            { x: 1930, y: 380, w: 175, h: 36, mat: 'wood_bridge', type: 'moving', vx: 0, vy: 95, minX: 1930, maxX: 1930, minY: 230, maxY: 420 },
            { x: 2180, y: 270, w: 240, h: 38, mat: 'clockwork_marble', type: 'platform' },
            { x: 2490, y: 430, w: 560, h: 140, mat: 'clockwork_marble', type: 'ground' },
            { x: 3120, y: 370, w: 175, h: 36, mat: 'wood_bridge', type: 'moving', vx: 135, vy: 0, minX: 3110, maxX: 3390, minY: 370, maxY: 370 },
            { x: 3630, y: 300, w: 175, h: 36, mat: 'wood_bridge', type: 'moving', vx: -135, vy: 0, minX: 3580, maxX: 3860, minY: 300, maxY: 300 },
            { x: 3640, y: 150, w: 190, h: 34, mat: 'clockwork_marble', type: 'platform' },
            { x: 4100, y: 420, w: 480, h: 140, mat: 'clockwork_marble', type: 'ground' },
            { x: 4660, y: 320, w: 720, h: 200, mat: 'clockwork_marble', type: 'ground' }
          ];

          const bouncePads = [
            { x: 1680, y: 372, w: 68, h: 22, power: -760, label: 'Resorte Dorado' },
            { x: 2940, y: 412, w: 68, h: 22, power: -740, label: 'Resorte Dorado' },
            { x: 4470, y: 402, w: 68, h: 22, power: -780, label: 'Resorte Real' }
          ];

          const notes = [
            { x: 240, y: 400 }, { x: 320, y: 400 }, { x: 630, y: 340 }, { x: 710, y: 340 },
            { x: 940, y: 280 }, { x: 1050, y: 260 }, { x: 1160, y: 280 },
            { x: 1490, y: 330 }, { x: 1580, y: 330 }, { x: 1680, y: 260 },
            { x: 2010, y: 240 }, { x: 2260, y: 210 }, { x: 2340, y: 210 },
            { x: 2600, y: 370 }, { x: 2700, y: 370 }, { x: 2800, y: 370 },
            { x: 3220, y: 300 }, { x: 3340, y: 300 }, { x: 3700, y: 230 },
            { x: 4200, y: 360 }, { x: 4300, y: 360 }, { x: 4400, y: 360 },
            { x: 4760, y: 260 }, { x: 4860, y: 260 }, { x: 4960, y: 260 }
          ].map((n, idx) => ({ ...n, id: idx, collected: false, phase: idx * 0.45 }));

          const clefs = [
            { x: 1575, y: 130, id: 1, collected: false, hint: 'Torre de Amatista' },
            { x: 3735, y: 88, id: 2, collected: false, hint: 'Balcón del Órgano Catedral' },
            { x: 4510, y: 190, id: 3, collected: false, hint: 'Salto a la Cumbre Real' }
          ];

          const enemies = [
            { x: 650, y: 356, baseY: 356, minX: 575, maxX: 760, vx: 105, type: 'owl', hp: 1, alive: true, stun: 0 },
            { x: 1500, y: 346, baseY: 346, minX: 1420, maxX: 1810, vx: 120, type: 'owl', hp: 1, alive: true, stun: 0 },
            { x: 2280, y: 226, baseY: 226, minX: 2190, maxX: 2400, vx: 115, type: 'wasp', hp: 1, alive: true, stun: 0 },
            { x: 2620, y: 386, baseY: 386, minX: 2520, maxX: 2980, vx: 135, type: 'crow', hp: 1, alive: true, stun: 0 },
            { x: 2820, y: 386, baseY: 386, minX: 2520, maxX: 2980, vx: -125, type: 'beetle', hp: 1, alive: true, stun: 0 },
            { x: 4220, y: 376, baseY: 376, minX: 4130, maxX: 4520, vx: 140, type: 'owl', hp: 1, alive: true, stun: 0 },
            { x: 4920, y: 270, baseY: 270, minX: 4720, maxX: 5080, vx: 150, type: 'maestro', hp: 2, alive: true, stun: 0 }
          ];

          const checkpoints = [
            { x: 1440, y: 325, active: false, name: 'Atril del Engranaje' },
            { x: 2540, y: 365, active: false, name: 'Atril del Péndulo' },
            { x: 4150, y: 355, active: false, name: 'Atril de la Cumbre' }
          ];

          return {
            levelNum: 2,
            name: 'Nivel 2: Cumbres del Reloj',
            worldWidth: 5450,
            skyTop: '#090418',
            skyMid: '#2e1065',
            skyBot: '#c026d3',
            platforms,
            bouncePads,
            waterPools: [],
            lianas: [],
            traps: [
              { x: 1600, y: 390, w: 54, h: 24, type: 'spikes', period: 2.2, phase: 0 },
              { x: 2740, y: 430, w: 54, h: 24, type: 'spikes', period: 2.0, phase: 1.0 }
            ],
            notes,
            clefs,
            enemies,
            checkpoints,
            goal: {
              x: 5160,
              y: 210,
              w: 110,
              h: 110,
              type: 'portal',
              title: 'Portal a Nivel 3 (Selva Esmeralda)'
            }
          };
        } else if (levelNum === 3) {
          // =====================================================================
          // LEVEL 3: SELVA ESMERALDA (LIANAS, AGUA 2.5D, COCODRILOS, TRAMPAS Y ENEMIGOS)
          // =====================================================================
          const platforms = [
            // Start Jungle Temple Terrace
            { x: -120, y: 440, w: 580, h: 140, mat: 'jungle_ruins', type: 'ground' },
            // Island 1 between Crocodile Lagoon 1
            { x: 760, y: 410, w: 280, h: 150, mat: 'jungle_ruins', type: 'ground' },
            // Canopy bamboo platform
            { x: 1120, y: 300, w: 210, h: 36, mat: 'wood_bridge', type: 'platform' },
            // Temple Bridge with traps
            { x: 1420, y: 430, w: 620, h: 150, mat: 'jungle_ruins', type: 'ground' },
            // Secret High Mayan Altar (Clef #1)
            { x: 1580, y: 200, w: 210, h: 36, mat: 'jungle_ruins', type: 'platform' },
            // Mid-Lagoon 2 Stone Pillar
            { x: 2360, y: 390, w: 220, h: 170, mat: 'jungle_ruins', type: 'ground' },
            // Moving Bamboo Raft above Crocodile River
            { x: 2660, y: 400, w: 180, h: 34, mat: 'wood_bridge', type: 'moving', vx: 120, vy: 0, minX: 2640, maxX: 2960, minY: 400, maxY: 400 },
            // Ancient Jungle Ruins Plaza
            { x: 3200, y: 420, w: 660, h: 150, mat: 'jungle_ruins', type: 'ground' },
            // Upper Canopy Walkways (Clef #2)
            { x: 3420, y: 250, w: 220, h: 36, mat: 'wood_bridge', type: 'platform' },
            { x: 3720, y: 170, w: 200, h: 36, mat: 'jungle_ruins', type: 'platform' },
            // Island 3 before Great Crocodile Swamp
            { x: 4220, y: 410, w: 320, h: 160, mat: 'jungle_ruins', type: 'ground' },
            // Final Grand Temple of El Tesoro de Petronia
            { x: 4920, y: 340, w: 860, h: 220, mat: 'jungle_ruins', type: 'ground' }
          ];

          // Deep 2.5D PBR Animated Water Lagoons with Crocodiles & Piranhas
          const waterPools = [
            { x: 440, y: 468, w: 340, h: 120, name: 'Laguna del Caimán' },
            { x: 1020, y: 468, w: 420, h: 120, name: 'Río de las Lianas' },
            { x: 2020, y: 468, w: 1200, h: 120, name: 'Pantano de los Cocodrilos' },
            { x: 3840, y: 468, w: 1100, h: 120, name: 'Gran Cenote Sagrado' }
          ];

          // Interactive Swinging Lianas (Jungle Vines!)
          const lianas = [
            { id: 1, anchorX: 600, anchorY: 40, length: 280, angle: 0.35, aVel: 0, baseSpeed: 2.3, phase: 0.0 },
            { id: 2, anchorX: 1230, anchorY: 30, length: 240, angle: -0.3, aVel: 0, baseSpeed: 2.4, phase: 1.2 },
            { id: 3, anchorX: 2180, anchorY: 35, length: 285, angle: 0.38, aVel: 0, baseSpeed: 2.3, phase: 2.1 },
            { id: 4, anchorX: 2820, anchorY: 35, length: 265, angle: -0.35, aVel: 0, baseSpeed: 2.5, phase: 0.7 },
            { id: 5, anchorX: 4030, anchorY: 35, length: 285, angle: 0.36, aVel: 0, baseSpeed: 2.4, phase: 1.8 },
            { id: 6, anchorX: 4650, anchorY: 30, length: 260, angle: -0.38, aVel: 0, baseSpeed: 2.5, phase: 2.9 },
            { id: 7, anchorX: 4820, anchorY: 25, length: 235, angle: 0.32, aVel: 0, baseSpeed: 2.6, phase: 0.4 }
          ];

          // Jungle Traps: Bamboo Retractable Spikes, Carnivorous Plants & Swinging Spiked Logs
          const traps = [
            { x: 860, y: 410, w: 56, h: 26, type: 'spikes', period: 2.1, phase: 0.0 },
            { x: 1560, y: 430, w: 60, h: 26, type: 'spikes', period: 1.9, phase: 0.6 },
            { x: 1790, y: 430, w: 48, h: 42, type: 'chomp_plant', period: 1.7, phase: 0.3 },
            { x: 3360, y: 420, w: 60, h: 26, type: 'spikes', period: 1.8, phase: 1.1 },
            { x: 3620, y: 420, w: 48, h: 42, type: 'chomp_plant', period: 1.6, phase: 0.8 },
            { x: 4350, y: 410, w: 56, h: 26, type: 'spikes', period: 1.8, phase: 0.2 }
          ];

          const bouncePads = [
            { x: 1920, y: 412, w: 68, h: 22, power: -760, label: 'Flor Elástica' },
            { x: 3260, y: 402, w: 68, h: 22, power: -750, label: 'Flor Elástica' },
            { x: 4460, y: 392, w: 68, h: 22, power: -770, label: 'Flor Real' }
          ];

          const notes = [
            // Over Lagoon 1 liana arc
            { x: 540, y: 290 }, { x: 600, y: 260 }, { x: 660, y: 290 },
            // Island 1 & Canopy
            { x: 820, y: 350 }, { x: 940, y: 350 }, { x: 1180, y: 240 }, { x: 1260, y: 240 },
            // Temple bridge
            { x: 1490, y: 370 }, { x: 1680, y: 350 }, { x: 1880, y: 370 },
            // Lagoon 2 Lianas & Raft
            { x: 2130, y: 280 }, { x: 2230, y: 280 }, { x: 2460, y: 330 },
            { x: 2740, y: 310 }, { x: 2850, y: 280 }, { x: 2960, y: 310 },
            // Ruins Plaza
            { x: 3320, y: 340 }, { x: 3500, y: 190 }, { x: 3780, y: 110 },
            // Final Cenote Lianas
            { x: 3980, y: 280 }, { x: 4080, y: 280 }, { x: 4640, y: 240 }, { x: 4800, y: 210 },
            // Summit approach
            { x: 5020, y: 280 }, { x: 5120, y: 280 }
          ].map((n, idx) => ({ ...n, id: idx, collected: false, phase: idx * 0.4 }));

          const clefs = [
            { x: 1685, y: 135, id: 1, collected: false, hint: 'Altar Maya Elevado' },
            { x: 3820, y: 105, id: 2, collected: false, hint: 'Copa Esmeralda de la Selva' },
            { x: 4740, y: 155, id: 3, collected: false, hint: 'Acrobacia entre Dos Lianas' }
          ];

          // Rich Jungle Roster: Crocodiles in Water, Leaping Piranhas, Jungle Snakes, Swooping Toucans & Temple Guardian!
          const enemies = [
            // Lagoon 1 Crocodile
            { x: 590, y: 466, baseY: 466, minX: 485, maxX: 725, vx: 85, type: 'croc', hp: 1, alive: true, stun: 0, jawTimer: 0 },
            // Lagoon 2 Crocodile + Leaping Piranha
            { x: 1210, y: 466, baseY: 466, minX: 1065, maxX: 1385, vx: 95, type: 'croc', hp: 1, alive: true, stun: 0, jawTimer: 0.8 },
            // Temple Bridge Emerald Snake & Swooping Toucan
            { x: 1660, y: 392, baseY: 392, minX: 1450, maxX: 1980, vx: 125, type: 'snake', hp: 1, alive: true, stun: 0 },
            { x: 1750, y: 250, baseY: 250, minX: 1480, maxX: 1960, vx: 135, type: 'toucan', hp: 1, alive: true, stun: 0 },
            // Swamp Crocodiles & Piranhas (Lagoon 3)
            { x: 2180, y: 466, baseY: 466, minX: 2065, maxX: 2315, vx: 90, type: 'croc', hp: 1, alive: true, stun: 0, jawTimer: 0.3 },
            { x: 2780, y: 466, baseY: 466, minX: 2620, maxX: 3140, vx: -105, type: 'croc', hp: 1, alive: true, stun: 0, jawTimer: 1.1 },
            { x: 3060, y: 465, baseY: 465, minX: 3050, maxX: 3070, vx: 0, type: 'piranha', hp: 1, alive: true, stun: 0 },
            // Ruins Plaza Snake & Toucan
            { x: 3500, y: 382, baseY: 382, minX: 3240, maxX: 3800, vx: 130, type: 'snake', hp: 1, alive: true, stun: 0 },
            { x: 3550, y: 175, baseY: 175, minX: 3350, maxX: 3820, vx: -140, type: 'toucan', hp: 1, alive: true, stun: 0 },
            // Great Cenote Crocodiles & Piranha (Lagoon 4)
            { x: 4020, y: 466, baseY: 466, minX: 3885, maxX: 4175, vx: 100, type: 'croc', hp: 1, alive: true, stun: 0, jawTimer: 0.5 },
            { x: 4680, y: 466, baseY: 466, minX: 4575, maxX: 4875, vx: -110, type: 'croc', hp: 1, alive: true, stun: 0, jawTimer: 1.4 },
            { x: 4590, y: 465, baseY: 465, minX: 4580, maxX: 4600, vx: 0, type: 'piranha', hp: 1, alive: true, stun: 0 },
            // Final Temple Guardian Boss
            { x: 5180, y: 290, baseY: 290, minX: 4960, maxX: 5360, vx: 160, type: 'maestro', hp: 2, alive: true, stun: 0 }
          ];

          const checkpoints = [
            { x: 1460, y: 365, active: false, name: 'Atril del Templo Maya' },
            { x: 3240, y: 355, active: false, name: 'Atril de las Lianas' },
            { x: 4960, y: 275, active: false, name: 'Atril del Tesoro Sagrado' }
          ];

          return {
            levelNum: 3,
            name: 'Nivel 3: Selva Esmeralda',
            worldWidth: 5850,
            skyTop: '#042f2e',
            skyMid: '#065f46',
            skyBot: '#d97706',
            platforms,
            bouncePads,
            waterPools,
            lianas,
            traps,
            notes,
            clefs,
            enemies,
            checkpoints,
            goal: {
              x: 5480,
              y: 230,
              w: 115,
              h: 110,
              type: 'portal',
              title: 'Portal al Nivel 4 (Cueva de Libélulas)'
            }
          };
        } else {
          // =====================================================================
          // LEVEL 4: LA CUEVA DE LAS LIBÉLULAS GIGANTES (HIGH DIFFICULTY + FINAL TREASURE)
          // =====================================================================
          const platforms = [
            // Cavern Entrance Ledge
            { x: -120, y: 440, w: 540, h: 140, mat: 'crystal_cavern', type: 'ground' },
            // Crystal Bridge 1 over Bioluminescent Abyss
            { x: 720, y: 400, w: 250, h: 160, mat: 'crystal_cavern', type: 'ground' },
            // Upper Stalagmite Terrace
            { x: 1060, y: 290, w: 190, h: 36, mat: 'crystal_cavern', type: 'platform' },
            // Moving Crystal Gondola 1
            { x: 1320, y: 390, w: 165, h: 34, mat: 'wood_bridge', type: 'moving', vx: 145, vy: 0, minX: 1300, maxX: 1620, minY: 390, maxY: 390 },
            // Central Cavern Sanctum (Checkpoint 1)
            { x: 1720, y: 420, w: 560, h: 150, mat: 'crystal_cavern', type: 'ground' },
            // Secret High Amethyst Vault (Clef #1)
            { x: 1860, y: 185, w: 190, h: 34, mat: 'crystal_cavern', type: 'platform' },
            // Crystal Pillar in Dragonfly Swarm Gorge
            { x: 2620, y: 380, w: 210, h: 170, mat: 'crystal_cavern', type: 'ground' },
            // Vertical Floating Crystal Elevator
            { x: 2920, y: 370, w: 160, h: 34, mat: 'crystal_cavern', type: 'moving', vx: 0, vy: 115, minX: 2920, maxX: 2920, minY: 220, maxY: 425 },
            // Mid-Air Crystal Span
            { x: 3180, y: 260, w: 210, h: 36, mat: 'crystal_cavern', type: 'platform' },
            // Deep Cavern Plaza (Checkpoint 2)
            { x: 3500, y: 425, w: 620, h: 150, mat: 'crystal_cavern', type: 'ground' },
            // High Crystal Archway (Clef #2)
            { x: 3780, y: 170, w: 190, h: 34, mat: 'crystal_cavern', type: 'platform' },
            // Fast Moving Crystal Raft over Subterranean Lake 3
            { x: 4460, y: 395, w: 170, h: 34, mat: 'wood_bridge', type: 'moving', vx: -160, vy: 0, minX: 4420, maxX: 4780, minY: 395, maxY: 395 },
            // Pre-Boss Crystal Outcrop
            { x: 4880, y: 405, w: 280, h: 160, mat: 'crystal_cavern', type: 'ground' },
            // Final Royal Crystal Altar of PETRONIA'S TREASURE!
            { x: 5520, y: 335, w: 920, h: 220, mat: 'crystal_cavern', type: 'ground' }
          ];

          // Bioluminescent Subterranean Cavern Lakes
          const waterPools = [
            { x: 400, y: 468, w: 340, h: 120, name: 'Lago Bioluminiscente' },
            { x: 950, y: 468, w: 790, h: 120, name: 'Abismo de las Libélulas' },
            { x: 2260, y: 468, w: 1260, h: 120, name: 'Fosa de Cristal Azul' },
            { x: 4100, y: 468, w: 1440, h: 120, name: 'Gran Laguna Subterránea' }
          ];

          // Glowing Subterranean Crystal-Root Vines (Lianas inside the Cave!)
          const lianas = [
            { id: 1, anchorX: 560, anchorY: 35, length: 275, angle: 0.38, aVel: 0, baseSpeed: 2.5, phase: 0.0 },
            { id: 2, anchorX: 2440, anchorY: 30, length: 280, angle: -0.36, aVel: 0, baseSpeed: 2.6, phase: 1.1 },
            { id: 3, anchorX: 4270, anchorY: 32, length: 280, angle: 0.40, aVel: 0, baseSpeed: 2.6, phase: 2.0 },
            { id: 4, anchorX: 5220, anchorY: 28, length: 265, angle: -0.38, aVel: 0, baseSpeed: 2.7, phase: 0.6 },
            { id: 5, anchorX: 5390, anchorY: 25, length: 235, angle: 0.35, aVel: 0, baseSpeed: 2.8, phase: 1.9 }
          ];

          // Cave Traps: Sharp Crystal Spikes & Snapping Cavern Traps
          const traps = [
            { x: 810, y: 400, w: 56, h: 28, type: 'spikes', period: 1.75, phase: 0.0 },
            { x: 1860, y: 420, w: 60, h: 28, type: 'spikes', period: 1.65, phase: 0.5 },
            { x: 2110, y: 420, w: 48, h: 42, type: 'chomp_plant', period: 1.55, phase: 0.2 },
            { x: 3660, y: 425, w: 60, h: 28, type: 'spikes', period: 1.60, phase: 0.9 },
            { x: 3920, y: 425, w: 60, h: 28, type: 'spikes', period: 1.55, phase: 0.3 },
            { x: 4990, y: 405, w: 56, h: 28, type: 'spikes', period: 1.50, phase: 0.7 }
          ];

          const bouncePads = [
            { x: 1755, y: 402, w: 68, h: 22, power: -775, label: 'Cristal Resonante' },
            { x: 3550, y: 407, w: 68, h: 22, power: -780, label: 'Cristal Resonante' },
            { x: 5070, y: 387, w: 68, h: 22, power: -790, label: 'Cristal Real' }
          ];

          const notes = [
            { x: 240, y: 380 }, { x: 320, y: 380 }, { x: 560, y: 265 },
            { x: 790, y: 340 }, { x: 890, y: 340 }, { x: 1120, y: 230 }, { x: 1200, y: 230 },
            { x: 1420, y: 320 }, { x: 1540, y: 320 },
            { x: 1820, y: 350 }, { x: 1980, y: 350 }, { x: 2180, y: 350 },
            { x: 2440, y: 260 }, { x: 2690, y: 320 }, { x: 2770, y: 320 },
            { x: 3000, y: 240 }, { x: 3250, y: 200 }, { x: 3330, y: 200 },
            { x: 3600, y: 360 }, { x: 3740, y: 360 }, { x: 3860, y: 110 },
            { x: 4270, y: 260 }, { x: 4540, y: 325 }, { x: 4660, y: 325 },
            { x: 4940, y: 345 }, { x: 5220, y: 235 }, { x: 5390, y: 205 },
            { x: 5640, y: 275 }, { x: 5740, y: 275 }, { x: 5840, y: 275 }
          ].map((n, idx) => ({ ...n, id: idx, collected: false, phase: idx * 0.38 }));

          const clefs = [
            { x: 1955, y: 120, id: 1, collected: false, hint: 'Bóveda de Amatista' },
            { x: 3875, y: 105, id: 2, collected: false, hint: 'Arco de las Libélulas' },
            { x: 5305, y: 145, id: 3, collected: false, hint: 'Salto Acrobático al Altar Final' }
          ];

          // GIANT DRAGONFLIES ("LIBÉLULAS GIGANTES") THAT ACTIVELY SWOOP & ATTACK PETRONIA!
          const enemies = [
            // Giant Dragonfly #1 guarding Abyss 1
            { x: 640, y: 215, baseY: 215, minX: 440, maxX: 940, vx: 145, type: 'giant_dragonfly', hp: 1, alive: true, stun: 0, attackState: 'patrol', attackTimer: 0.6 },
            // Giant Dragonfly #2 over Crystal Gondola
            { x: 1380, y: 195, baseY: 195, minX: 1080, maxX: 1660, vx: -155, type: 'giant_dragonfly', hp: 1, alive: true, stun: 0, attackState: 'patrol', attackTimer: 1.2 },
            // Central Sanctum Giant Dragonfly #3 & #4
            { x: 1980, y: 225, baseY: 225, minX: 1740, maxX: 2240, vx: 160, type: 'giant_dragonfly', hp: 1, alive: true, stun: 0, attackState: 'patrol', attackTimer: 0.4 },
            { x: 2520, y: 190, baseY: 190, minX: 2320, maxX: 2840, vx: -165, type: 'giant_dragonfly', hp: 1, alive: true, stun: 0, attackState: 'patrol', attackTimer: 0.9 },
            // Subterranean Croc in Blue Crystal Trench
            { x: 2480, y: 466, baseY: 466, minX: 2310, maxX: 2580, vx: 105, type: 'croc', hp: 1, alive: true, stun: 0, jawTimer: 0.4 },
            // Giant Dragonfly #5 & #6 in Mid-Air Crystal Span
            { x: 3220, y: 165, baseY: 165, minX: 2940, maxX: 3460, vx: 170, type: 'giant_dragonfly', hp: 1, alive: true, stun: 0, attackState: 'patrol', attackTimer: 0.5 },
            { x: 3780, y: 220, baseY: 220, minX: 3520, maxX: 4060, vx: -175, type: 'giant_dragonfly', hp: 1, alive: true, stun: 0, attackState: 'patrol', attackTimer: 1.1 },
            // Giant Dragonfly #7 & #8 over Great Subterranean Lagoon
            { x: 4380, y: 200, baseY: 200, minX: 4140, maxX: 4620, vx: 175, type: 'giant_dragonfly', hp: 1, alive: true, stun: 0, attackState: 'patrol', attackTimer: 0.3 },
            { x: 4720, y: 215, baseY: 215, minX: 4480, maxX: 4920, vx: -180, type: 'giant_dragonfly', hp: 1, alive: true, stun: 0, attackState: 'patrol', attackTimer: 1.4 },
            // Giant Dragonfly #9 guarding the Final Vine Chasm
            { x: 5280, y: 185, baseY: 185, minX: 5020, maxX: 5480, vx: 185, type: 'giant_dragonfly', hp: 1, alive: true, stun: 0, attackState: 'patrol', attackTimer: 0.7 },
            // Final Altar Squadron: Giant Dragonfly #10 + Royal Queen Dragonfly Boss!
            { x: 5720, y: 195, baseY: 195, minX: 5540, maxX: 6020, vx: -180, type: 'giant_dragonfly', hp: 1, alive: true, stun: 0, attackState: 'patrol', attackTimer: 0.8 },
            { x: 5920, y: 180, baseY: 180, minX: 5600, maxX: 6120, vx: 195, type: 'queen_dragonfly', hp: 3, alive: true, stun: 0, attackState: 'patrol', attackTimer: 0.5 }
          ];

          const checkpoints = [
            { x: 1760, y: 355, active: false, name: 'Atril de la Cueva Cristalina' },
            { x: 3540, y: 360, active: false, name: 'Atril del Enjambre Gigante' },
            { x: 5560, y: 270, active: false, name: 'Atril del Tesoro Final' }
          ];

          return {
            levelNum: 4,
            name: 'Nivel 4: Cueva de las Libélulas',
            worldWidth: 6480,
            skyTop: '#050314',
            skyMid: '#0f172a',
            skyBot: '#0e7490',
            platforms,
            bouncePads,
            waterPools,
            lianas,
            traps,
            notes,
            clefs,
            enemies,
            checkpoints,
            goal: {
              x: 6120,
              y: 240,
              w: 125,
              h: 95,
              type: 'treasure',
              title: "PETRONIA'S TREASURE (El Tesoro Final)",
              opened: false
            }
          };
        }
      }

      // =========================================================================
      // 5. GAME STATE, LIANA PENDULUM PHYSICS & 2.5D PBR RENDERER
      // =========================================================================
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');

      const pbrConfig = {
        normalStrength: 1.2,
        specularBoost: 1.35,
        extrudeDepth: 24,
        parallaxScale: 1.0
      };

      const keys = {
        left: false,
        right: false,
        up: false,
        wave: false,
        dash: false
      };

      let gameState = {
        mode: 'start',
        levelNum: 1,
        level: buildLevelData(1),
        score: 0,
        time: 0,
        cameraX: 0,
        cameraY: 0,
        particles: [],
        soundWaves: [],
        floatingTexts: []
      };

      const player = {
        x: 120,
        y: 320,
        vx: 0,
        vy: 0,
        w: 58,
        h: 88,
        facing: 1,
        onGround: false,
        jumpsLeft: 2,
        hp: 4,
        maxHp: 4,
        harmony: 100,
        invulnTimer: 0,
        dashTimer: 0,
        dashCooldown: 0,
        waveCooldown: 0,
        animTimer: 0,
        walkFrame: 0,
        spawnX: 120,
        spawnY: 320,
        celebrating: false,
        // Liana swinging state
        attachedLiana: null,
        lianaSlidePos: 0.92,
        lianaCooldown: 0
      };

      function resetPlayerForLevel(lvlNum, keepScore = false) {
        gameState.levelNum = lvlNum;
        gameState.level = buildLevelData(lvlNum);
        if (!keepScore) {
          gameState.score = 0;
        }
        player.x = 120;
        player.y = 300;
        player.vx = 0;
        player.vy = 0;
        player.facing = 1;
        player.onGround = false;
        player.jumpsLeft = 2;
        player.hp = 4;
        player.harmony = 100;
        player.invulnTimer = 0;
        player.dashTimer = 0;
        player.celebrating = false;
        player.attachedLiana = null;
        player.lianaCooldown = 0;
        player.spawnX = 120;
        player.spawnY = 300;
        gameState.cameraX = 0;
        gameState.cameraY = 0;
        gameState.particles = [];
        gameState.soundWaves = [];
        gameState.floatingTexts = [];
        updateHUD();
        updateLevelButtons();
      }

      function respawnAtCheckpoint() {
        player.x = player.spawnX;
        player.y = player.spawnY - 30;
        player.vx = 0;
        player.vy = 0;
        player.attachedLiana = null;
        player.hp = player.maxHp;
        player.invulnTimer = 1.2;
        spawnBurst(player.x + player.w / 2, player.y + player.h / 2, '#f59e0b', 22);
        updateHUD();
      }

      function spawnBurst(x, y, color, count = 14) {
        for (let i = 0; i < count; i++) {
          const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
          const spd = 65 + Math.random() * 190;
          gameState.particles.push({
            x,
            y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 40,
            life: 0.45 + Math.random() * 0.4,
            maxLife: 0.85,
            size: 4 + Math.random() * 5,
            color,
            note: Math.random() > 0.55 ? (Math.random() > 0.5 ? '♪' : '♫') : null
          });
        }
      }

      function addFloatingText(x, y, text, color = '#fbbf24') {
        gameState.floatingTexts.push({
          x,
          y,
          text,
          color,
          life: 1.0
        });
      }

      function triggerJump() {
        if (gameState.mode !== 'playing') return;

        // If swinging on a Liana, launch off with acrobatic momentum!
        if (player.attachedLiana) {
          const v = player.attachedLiana;
          const tangSpeed = v.aVel * v.length;
          player.vx = Math.cos(v.angle) * tangSpeed * 1.15 + player.facing * 230;
          player.vy = -565;
          player.attachedLiana = null;
          player.lianaCooldown = 0.42;
          player.jumpsLeft = 1;
          sound.sfxVineLaunch();
          spawnBurst(player.x + player.w / 2, player.y + player.h / 2, '#34d399', 16);
          addFloatingText(player.x + player.w / 2, player.y - 10, '¡Salto en Liana! 🌿', '#6ee7b7');
          return;
        }

        if (player.onGround) {
          player.vy = -540;
          player.onGround = false;
          player.jumpsLeft = 1;
          sound.sfxJump(false);
          spawnBurst(player.x + player.w / 2, player.y + player.h, '#e9d5ff', 8);
        } else if (player.jumpsLeft > 0) {
          player.vy = -495;
          player.jumpsLeft--;
          sound.sfxJump(true);
          spawnBurst(player.x + player.w / 2, player.y + player.h * 0.7, '#f59e0b', 14);
          addFloatingText(player.x + player.w / 2, player.y, '¡Aleteo! 𝄞', '#e879f9');
        }
      }

      function triggerMusicalWave() {
        if (gameState.mode !== 'playing') return;
        if (player.waveCooldown > 0 || player.harmony < 20) return;
        player.waveCooldown = 0.45;
        player.harmony = Math.max(0, player.harmony - 22);
        sound.sfxWave();
        gameState.soundWaves.push({
          x: player.facing === 1 ? player.x + player.w : player.x - 24,
          y: player.y + player.h * 0.48,
          vx: player.facing * 560,
          r: 26,
          life: 0.65,
          facing: player.facing
        });
        spawnBurst(player.x + player.w / 2 + player.facing * 25, player.y + player.h * 0.5, '#c084fc', 10);
        updateHUD();
      }

      function triggerDash() {
        if (gameState.mode !== 'playing') return;
        if (player.dashCooldown > 0) return;
        if (player.attachedLiana) {
          player.attachedLiana = null;
          player.lianaCooldown = 0.4;
        }
        player.dashTimer = 0.18;
        player.dashCooldown = 0.75;
        player.vx = player.facing * 640;
        player.vy = Math.min(player.vy, 0);
        sound.sfxDash();
        spawnBurst(player.x + player.w / 2, player.y + player.h / 2, '#fbbf24', 12);
      }

      // =========================================================================
      // 6. UPDATE LOOP (PHYSICS, LIANAS, WATER & CROCODILES, TRAPS, ENEMIES)
      // =========================================================================
      function updateGame(dt) {
        gameState.time += dt;
        if (gameState.mode !== 'playing') return;

        const lvl = gameState.level;
        const t = gameState.time;

        if (player.invulnTimer > 0) player.invulnTimer -= dt;
        if (player.dashTimer > 0) player.dashTimer -= dt;
        if (player.dashCooldown > 0) player.dashCooldown -= dt;
        if (player.waveCooldown > 0) player.waveCooldown -= dt;
        if (player.lianaCooldown > 0) player.lianaCooldown -= dt;
        player.harmony = Math.min(100, player.harmony + dt * 18);

        // Moving platforms
        for (const p of lvl.platforms) {
          if (p.type === 'moving') {
            p.prevX = p.x;
            p.prevY = p.y;
            if (p.vx) {
              p.x += p.vx * dt;
              if (p.x < p.minX) { p.x = p.minX; p.vx *= -1; }
              if (p.x > p.maxX) { p.x = p.maxX; p.vx *= -1; }
            }
            if (p.vy) {
              p.y += p.vy * dt;
              if (p.y < p.minY) { p.y = p.minY; p.vy *= -1; }
              if (p.y > p.maxY) { p.y = p.maxY; p.vy *= -1; }
            }
          }
        }

        // Update Lianas (Jungle Vines)
        for (const v of lvl.lianas) {
          if (player.attachedLiana === v) {
            // Player-driven pendulum swing physics
            const gravTorque = -4.2 * Math.sin(v.angle);
            let pump = 0;
            if (keys.left) { pump = -2.6; player.facing = -1; }
            if (keys.right) { pump = 2.6; player.facing = 1; }
            v.aVel += (gravTorque + pump) * dt;
            v.aVel *= Math.pow(0.992, dt * 60);
            v.angle = Math.max(-1.05, Math.min(1.05, v.angle + v.aVel * dt));
          } else {
            // Gentle ambient jungle breeze oscillation when free
            const targetAngle = Math.sin(t * v.baseSpeed + v.phase) * 0.45;
            v.aVel = (targetAngle - v.angle) / Math.max(dt, 0.016);
            v.angle = targetAngle;
          }
          v.tipX = v.anchorX + Math.sin(v.angle) * v.length;
          v.tipY = v.anchorY + Math.cos(v.angle) * v.length;
        }

        // Check if Petronia grabs a Liana while airborne
        if (!player.attachedLiana && !player.onGround && player.lianaCooldown <= 0) {
          const pxCenter = player.x + player.w / 2;
          const pyHand = player.y + player.h * 0.35;
          for (const v of lvl.lianas) {
            // Check distance to lower 65% of the liana rope
            for (let s = 0.4; s <= 1.0; s += 0.15) {
              const rx = v.anchorX + Math.sin(v.angle) * (v.length * s);
              const ry = v.anchorY + Math.cos(v.angle) * (v.length * s);
              if (Math.hypot(pxCenter - rx, pyHand - ry) < 38) {
                player.attachedLiana = v;
                player.lianaSlidePos = Math.max(0.55, Math.min(0.95, s));
                v.aVel = (player.vx / v.length) * 0.85;
                player.vx = 0;
                player.vy = 0;
                player.jumpsLeft = 2;
                sound.sfxVineGrab();
                spawnBurst(rx, ry, '#4ade80', 10);
                addFloatingText(rx, ry - 15, '¡Liana! [◀/▶ Balancear, ▲ Saltar]', '#86efac');
                break;
              }
            }
            if (player.attachedLiana) break;
          }
        }

        if (player.attachedLiana) {
          // Lock player position to attached liana rope
          const v = player.attachedLiana;
          const holdLen = v.length * player.lianaSlidePos;
          const holdX = v.anchorX + Math.sin(v.angle) * holdLen;
          const holdY = v.anchorY + Math.cos(v.angle) * holdLen;
          player.x = holdX - player.w / 2;
          player.y = holdY - player.h * 0.35;
          player.onGround = false;
        } else {
          // Standard Horizontal Movement
          const moveAccel = player.onGround ? 2200 : 1550;
          const maxSpeed = 295;
          if (player.dashTimer <= 0) {
            if (keys.left) {
              player.vx = Math.max(player.vx - moveAccel * dt, -maxSpeed);
              player.facing = -1;
            } else if (keys.right) {
              player.vx = Math.min(player.vx + moveAccel * dt, maxSpeed);
              player.facing = 1;
            } else {
              const friction = player.onGround ? 0.80 : 0.92;
              player.vx *= Math.pow(friction, dt * 60);
              if (Math.abs(player.vx) < 8) player.vx = 0;
            }
          }

          // Gravity + Feather Glide
          const isGliding = !player.onGround && player.vy > 40 && keys.up;
          const gravity = isGliding ? 520 : 1280;
          if (player.dashTimer <= 0) {
            player.vy += gravity * dt;
            if (isGliding && player.vy > 175) {
              player.vy = 175;
            }
          }

          const prevBottom = player.y + player.h;
          player.x += player.vx * dt;
          player.y += player.vy * dt;

          if (player.x < 10) { player.x = 10; player.vx = 0; }
          if (player.x > lvl.worldWidth - player.w - 10) {
            player.x = lvl.worldWidth - player.w - 10;
          }

          player.onGround = false;
          for (const p of lvl.platforms) {
            const withinX = player.x + player.w * 0.78 > p.x && player.x + player.w * 0.22 < p.x + p.w;
            if (withinX && player.vy >= 0) {
              const newBottom = player.y + player.h;
              if (prevBottom <= p.y + 14 && newBottom >= p.y) {
                player.y = p.y - player.h;
                player.vy = 0;
                player.onGround = true;
                player.jumpsLeft = 2;
                if (p.type === 'moving') {
                  player.x += (p.x - (p.prevX ?? p.x));
                  player.y += (p.y - (p.prevY ?? p.y));
                }
              }
            }
          }
        }

        // Walk cycle animation & footstep SFX
        if (player.onGround && Math.abs(player.vx) > 22) {
          const speedRatio = Math.abs(player.vx) / 295;
          player.animTimer += dt * (10 + speedRatio * 6);
          const nextFrame = Math.floor(player.animTimer) % 8;
          if (nextFrame !== player.walkFrame && (nextFrame === 1 || nextFrame === 5)) {
            sound.sfxStep();
          }
          player.walkFrame = nextFrame;
        } else {
          player.animTimer = 0;
        }

        const pxCenter = player.x + player.w / 2;
        const pyCenter = player.y + player.h / 2;

        // Water Pools Interaction (Splash + Buoyant Escape Jump!)
        for (const wp of lvl.waterPools) {
          if (pxCenter > wp.x && pxCenter < wp.x + wp.w && player.y + player.h > wp.y + 12) {
            // Splashed into crocodile lagoon water!
            sound.sfxSplash();
            spawnBurst(pxCenter, wp.y, '#38bdf8', 20);
            spawnBurst(pxCenter, wp.y, '#e0f2fe', 12);
            player.vy = -560; // Reflex jump out of water
            player.jumpsLeft = 1;
            if (player.invulnTimer <= 0) {
              player.hp--;
              player.invulnTimer = 1.25;
              addFloatingText(pxCenter, wp.y - 20, '¡Agua Profunda! 💦', '#38bdf8');
              updateHUD();
              if (player.hp <= 0) {
                respawnAtCheckpoint();
              }
            }
          }
        }

        // Jungle Traps Interaction (Bamboo Spikes & Carnivorous Plants)
        for (const tr of lvl.traps) {
          const cycle = (t + tr.phase) % tr.period;
          tr.extended = cycle < tr.period * 0.52;
          if (tr.extended && player.invulnTimer <= 0 && player.dashTimer <= 0) {
            if (
              pxCenter > tr.x - 10 &&
              pxCenter < tr.x + tr.w + 10 &&
              player.y + player.h > tr.y - 26 &&
              player.y < tr.y + 10
            ) {
              player.hp--;
              player.invulnTimer = 1.25;
              player.vy = -420;
              sound.sfxHurt();
              spawnBurst(pxCenter, tr.y - 12, '#ef4444', 16);
              addFloatingText(pxCenter, tr.y - 30, tr.type === 'spikes' ? '¡Trampa de Bambú!' : '¡Planta Carnívora!', '#fca5a5');
              updateHUD();
              if (player.hp <= 0) respawnAtCheckpoint();
            }
          }
        }

        // Bounce Pads
        for (const bp of lvl.bouncePads) {
          if (
            player.x + player.w * 0.75 > bp.x &&
            player.x + player.w * 0.25 < bp.x + bp.w &&
            player.y + player.h >= bp.y - 6 &&
            player.y + player.h <= bp.y + bp.h + 16 &&
            player.vy >= -50
          ) {
            player.vy = bp.power;
            player.onGround = false;
            player.jumpsLeft = 2;
            bp.bounceAnim = 1.0;
            sound.sfxBounce();
            spawnBurst(bp.x + bp.w / 2, bp.y, '#fbbf24', 16);
            addFloatingText(bp.x + bp.w / 2, bp.y - 15, '¡Impulso Musical! ♫', '#fbbf24');
          }
          if (bp.bounceAnim > 0) bp.bounceAnim = Math.max(0, bp.bounceAnim - dt * 4);
        }

        // Collect Golden Notes
        for (const n of lvl.notes) {
          if (!n.collected) {
            const dx = pxCenter - n.x;
            const dy = pyCenter - n.y;
            if (dx * dx + dy * dy < 44 * 44) {
              n.collected = true;
              gameState.score += 50;
              player.harmony = Math.min(100, player.harmony + 10);
              sound.sfxNote();
              spawnBurst(n.x, n.y, '#fbbf24', 10);
              addFloatingText(n.x, n.y - 10, '+50 ♪', '#fde047');
              updateHUD();
            }
          }
        }

        // Collect Secret Purple Treble Clefs (𝄞)
        for (const c of lvl.clefs) {
          if (!c.collected) {
            const dx = pxCenter - c.x;
            const dy = pyCenter - c.y;
            if (dx * dx + dy * dy < 52 * 52) {
              c.collected = true;
              gameState.score += 300;
              player.hp = Math.min(player.maxHp, player.hp + 1);
              sound.sfxClef();
              spawnBurst(c.x, c.y, '#e879f9', 24);
              addFloatingText(c.x, c.y - 18, '¡Clave de Sol 𝄞 +300!', '#f0abfc');
              updateHUD();
            }
          }
        }

        // Checkpoints
        for (const cp of lvl.checkpoints) {
          if (!cp.active && Math.abs(pxCenter - cp.x) < 48 && Math.abs(pyCenter - cp.y) < 75) {
            cp.active = true;
            player.spawnX = cp.x - player.w / 2;
            player.spawnY = cp.y - player.h + 25;
            gameState.score += 100;
            sound.sfxCheckpoint();
            spawnBurst(cp.x, cp.y - 25, '#34d399', 18);
            addFloatingText(cp.x, cp.y - 45, '¡Control: ' + cp.name + '!', '#6ee7b7');
            updateHUD();
          }
        }

        // Soundwave projectiles update & enemy hit
        for (let i = gameState.soundWaves.length - 1; i >= 0; i--) {
          const sw = gameState.soundWaves[i];
          sw.x += sw.vx * dt;
          sw.r += dt * 28;
          sw.life -= dt;
          for (const en of lvl.enemies) {
            if (en.alive && Math.abs(sw.x - en.x) < sw.r + 34 && Math.abs(sw.y - en.y) < sw.r + 34) {
              en.hp--;
              sw.life = 0;
              sound.sfxEnemyStomp();
              spawnBurst(en.x, en.y, '#c084fc', 16);
              if (en.hp <= 0 && en.type !== 'croc') {
                en.alive = false;
                gameState.score += 150;
                addFloatingText(en.x, en.y - 20, '¡Armonizado! +150', '#c084fc');
              } else {
                en.stun = 2.2;
                en.hp = Math.max(1, en.hp);
                addFloatingText(en.x, en.y - 20, '¡Aturdido! 𝄞', '#fbbf24');
              }
              updateHUD();
            }
          }
          if (sw.life <= 0) gameState.soundWaves.splice(i, 1);
        }

        // Enemies update & player collision (Giant Dragonflies, Crocodiles, Piranhas, Snakes, Toucans, Owls, Crows)
        for (const en of lvl.enemies) {
          if (!en.alive) continue;
          const isDragonfly = (en.type === 'giant_dragonfly' || en.type === 'queen_dragonfly');
          if (en.stun > 0) {
            en.stun -= dt;
            if (isDragonfly) en.attackState = 'patrol';
          } else if (isDragonfly) {
            // GIANT DRAGONFLY AI: Patrol -> Lock-On Telegraph -> High-Speed Dive Attack -> Recover
            en.attackTimer = (en.attackTimer ?? 0.8) - dt;
            const distToPlayerX = Math.abs(pxCenter - en.x);

            if (en.attackState === 'patrol' || !en.attackState) {
              en.x += en.vx * dt;
              if (en.x < en.minX) { en.x = en.minX; en.vx = Math.abs(en.vx); }
              if (en.x > en.maxX) { en.x = en.maxX; en.vx = -Math.abs(en.vx); }
              en.y = (en.baseY || 200) + Math.sin(t * 5.5 + en.x * 0.025) * 22;

              // Trigger attack lock-on when Petronia is in range!
              if (distToPlayerX < 390 && en.attackTimer <= 0) {
                en.attackState = 'telegraph';
                en.stateTime = 0.50;
                en.targetX = pxCenter;
                en.targetY = Math.min(435, pyCenter + 10);
                en.dodgedAwarded = false;
                en.vx = (pxCenter >= en.x ? 1 : -1) * Math.abs(en.vx || 165);
                if (distToPlayerX < 340) sound.sfxDragonflyBuzz();
              }
            } else if (en.attackState === 'telegraph') {
              // Hover & vibrate wings while aiming at Petronia
              en.stateTime -= dt;
              en.y += Math.sin(t * 38) * 1.6;
              if (en.stateTime <= 0) {
                en.attackState = 'dive';
                en.stateTime = 0.68;
                const ang = Math.atan2(en.targetY - en.y, en.targetX - en.x);
                const diveSpd = en.type === 'queen_dragonfly' ? 510 : 455;
                en.diveVx = Math.cos(ang) * diveSpd;
                en.diveVy = Math.sin(ang) * diveSpd;
                if (distToPlayerX < 420) sound.sfxDragonflySwoop();
              }
            } else if (en.attackState === 'dive') {
              en.stateTime -= dt;
              en.x += en.diveVx * dt;
              en.y += en.diveVy * dt;
              // Award Dodge Bonus if Petronia evades a close swoop!
              const dPlayer = Math.hypot(pxCenter - en.x, pyCenter - en.y);
              if (!en.dodgedAwarded && dPlayer > 48 && dPlayer < 118 && en.stateTime < 0.35) {
                en.dodgedAwarded = true;
                gameState.score += 75;
                sound.sfxDodgePerfect();
                addFloatingText(pxCenter, player.y - 16, '¡Esquivada! +75 ✨', '#67e8f9');
                updateHUD();
              }
              if (en.stateTime <= 0 || en.y > 435) {
                en.attackState = 'recover';
                en.stateTime = 0.65;
              }
            } else if (en.attackState === 'recover') {
              en.stateTime -= dt;
              en.x += (en.vx * 0.6) * dt;
              en.y += ((en.baseY || 200) - en.y) * Math.min(1, dt * 5.2);
              if (en.stateTime <= 0) {
                en.attackState = 'patrol';
                en.attackTimer = en.type === 'queen_dragonfly' ? 0.95 : (1.35 + Math.random() * 0.6);
              }
            }
          } else {
            if (en.type === 'piranha') {
              // Leaping vertical arc out of water
              const pCycle = (t * 2.2 + en.x * 0.01) % (Math.PI * 2);
              en.y = (en.baseY || 465) - Math.max(0, Math.sin(pCycle) * 185);
            } else {
              en.x += en.vx * dt;
              if (en.x < en.minX) { en.x = en.minX; en.vx *= -1; }
              if (en.x > en.maxX) { en.x = en.maxX; en.vx *= -1; }
              if (en.type === 'toucan' || en.type === 'wasp') {
                en.y = (en.baseY || en.y) + Math.sin(t * 4.5 + en.x * 0.03) * 28;
              }
            }
            if (en.type === 'croc') {
              en.jawTimer = (en.jawTimer || 0) + dt * 2.4;
              en.mouthOpen = Math.sin(en.jawTimer) > 0.15;
            }
          }

          const hitW = en.type === 'croc' ? 54 : (isDragonfly ? 46 : 40);
          const hitH = en.type === 'croc' ? 36 : (isDragonfly ? 38 : 46);
          const dx = Math.abs(pxCenter - en.x);
          const dy = Math.abs(pyCenter - en.y);
          if (dx < hitW && dy < hitH) {
            // If crocodile has jaws closed or is stunned, Petronia can bounce off its armored back!
            if (en.type === 'croc' && (!en.mouthOpen || en.stun > 0) && player.vy > 0 && pyCenter < en.y) {
              player.vy = -540;
              player.jumpsLeft = 2;
              sound.sfxBounce();
              spawnBurst(en.x, en.y - 10, '#4ade80', 14);
              addFloatingText(en.x, en.y - 25, '¡Salto sobre Cocodrilo! 🐊', '#86efac');
            } else if (en.type !== 'croc' && player.vy > 60 && pyCenter < en.y - 6) {
              en.hp--;
              player.vy = -465;
              player.jumpsLeft = 2;
              sound.sfxEnemyStomp();
              spawnBurst(en.x, en.y, '#fbbf24', 18);
              if (en.hp <= 0) {
                en.alive = false;
                gameState.score += isDragonfly ? 200 : 150;
                addFloatingText(en.x, en.y - 20, isDragonfly ? '¡Libélula Superada! +200' : '¡Salto Armónico! +150', '#fde047');
              } else {
                en.stun = 1.6;
                en.attackState = 'patrol';
                addFloatingText(en.x, en.y - 20, '¡Golpe Real!', '#fbbf24');
              }
              updateHUD();
            } else if (player.invulnTimer <= 0 && player.dashTimer <= 0) {
              player.hp--;
              player.invulnTimer = 1.25;
              player.vy = -400;
              player.vx = (pxCenter < en.x ? -1 : 1) * 260;
              if (en.type === 'croc') sound.sfxCrocSnap();
              else sound.sfxHurt();
              spawnBurst(pxCenter, pyCenter, '#ef4444', 16);
              const hurtMsg = en.type === 'croc'
                ? '¡Mordisco de Cocodrilo! 🐊'
                : (isDragonfly ? '¡Ataque de Libélula Gigante! ¡Esquiva con [Shift] o Salto!' : '¡Cuidado!');
              addFloatingText(pxCenter, player.y - 10, hurtMsg, '#fca5a5');
              updateHUD();
              if (player.hp <= 0) {
                respawnAtCheckpoint();
              }
            }
          }
        }

        if (player.y > 680) {
          sound.sfxHurt();
          respawnAtCheckpoint();
        }

        // Goal / Level Transition / Final Treasure check (4 Levels!)
        const g = lvl.goal;
        if (
          pxCenter > g.x - 20 &&
          pxCenter < g.x + g.w + 20 &&
          pyCenter > g.y - 30 &&
          pyCenter < g.y + g.h + 40
        ) {
          sound.sfxVictory();
          player.celebrating = true;
          player.attachedLiana = null;
          spawnBurst(g.x + g.w / 2, g.y + g.h / 2, '#fbbf24', 36);
          spawnBurst(g.x + g.w / 2, g.y + g.h / 2, '#e879f9', 28);
          if (gameState.levelNum === 1) {
            gameState.mode = 'level_complete';
            showStatusModal(
              '¡Nivel 1 Completado!',
              'Has cruzado el Bosque Melódico con el soundtrack de flautas saltarinas. ¡Avanza al Nivel 2: Cumbres del Reloj!',
              '▶ Avanzar al Nivel 2'
            );
          } else if (gameState.levelNum === 2) {
            gameState.mode = 'level_complete';
            showStatusModal(
              '¡Nivel 2 Completado!',
              '¡Has superado las Cumbres del Reloj! Prepárate para columpiarte en lianas y esquivar cocodrilos en el Nivel 3: Selva Esmeralda.',
              '🌴 Avanzar al Nivel 3 (Selva)'
            );
          } else if (gameState.levelNum === 3) {
            gameState.mode = 'level_complete';
            showStatusModal(
              '¡Nivel 3 Completado!',
              '¡Has cruzado la Selva Esmeralda! Ahora entra al desafío final de máxima dificultad: La Cueva de las Libélulas Gigantes, esquiva sus ataques y encuentra El Tesoro Final.',
              '💎 Entrar al Nivel 4 (Cueva de Libélulas)'
            );
          } else {
            g.opened = true;
            gameState.score += 1500;
            updateHUD();
            gameState.mode = 'victory';
            showStatusModal(
              "¡PETRONIA'S TREASURE ES TUYO!",
              "¡Victoria Total en Sparrow's Tale! Esquivaste a las Libélulas Gigantes en lo profundo de la Cueva de Cristal y encontraste El Tesoro Final de Petronia.",
              '🏆 Jugar de Nuevo'
            );
          }
        }

        // Particles & Floating Texts
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
          const pt = gameState.particles[i];
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.vy += 260 * dt;
          pt.life -= dt;
          if (pt.life <= 0) gameState.particles.splice(i, 1);
        }
        for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
          const ft = gameState.floatingTexts[i];
          ft.y -= 38 * dt;
          ft.life -= dt;
          if (ft.life <= 0) gameState.floatingTexts.splice(i, 1);
        }

        const viewW = canvas.width;
        const targetCamX = Math.max(0, Math.min(lvl.worldWidth - viewW, player.x - viewW * 0.36));
        gameState.cameraX += (targetCamX - gameState.cameraX) * Math.min(1, dt * 7.5);

        const progressPct = Math.min(100, Math.max(0, ((player.x - 100) / (lvl.goal.x - 100)) * 100));
        const progEl = document.getElementById('hudProgressBar');
        if (progEl) progEl.style.width = progressPct.toFixed(1) + '%';
      }

      // =========================================================================
      // 7. 2.5D CARTOON PBR, LIANAS, CROCODILES & WATER RENDERING PIPELINE
      // =========================================================================
      function drawParallaxBackground(w, h, camX, lvl, t) {
        const pScale = pbrConfig.parallaxScale;

        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, lvl.skyTop);
        skyGrad.addColorStop(0.58, lvl.skyMid);
        skyGrad.addColorStop(1, lvl.skyBot);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Layer 1: Sun / Moon / Cavern Crystal Aperture & Volumetric Rays
        ctx.save();
        const sunX = w * 0.72 - (camX * 0.03 * pScale) % (w * 0.5);
        const sunY = h * 0.22;
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 170);
        if (lvl.levelNum === 4) {
          sunGlow.addColorStop(0, 'rgba(165, 243, 252, 0.95)');
          sunGlow.addColorStop(0.45, 'rgba(217, 70, 239, 0.45)');
          sunGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
        } else if (lvl.levelNum === 3) {
          sunGlow.addColorStop(0, 'rgba(253, 224, 71, 0.95)');
          sunGlow.addColorStop(0.4, 'rgba(16, 185, 129, 0.45)');
          sunGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
        } else if (lvl.levelNum === 1) {
          sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
          sunGlow.addColorStop(0.35, 'rgba(251, 191, 36, 0.45)');
          sunGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        } else {
          sunGlow.addColorStop(0, 'rgba(245, 208, 254, 0.95)');
          sunGlow.addColorStop(0.4, 'rgba(192, 132, 252, 0.45)');
          sunGlow.addColorStop(1, 'rgba(192, 132, 252, 0)');
        }
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 170, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = lvl.levelNum === 4 ? 'rgba(103, 232, 249, 0.07)' : (lvl.levelNum === 3 ? 'rgba(167, 243, 208, 0.06)' : 'rgba(254, 243, 199, 0.05)');
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(sunX, sunY);
          const a1 = 0.35 + i * 0.22 + Math.sin(t * 0.4 + i) * 0.03;
          ctx.lineTo(sunX + Math.cos(a1) * 900, h);
          ctx.lineTo(sunX + Math.cos(a1 + 0.11) * 900, h);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // Layer 2: Distant Mountains / Mayan Jungle Pyramids / Cavern Stalactites & Crystal Pillars
        ctx.save();
        const offset2 = -(camX * 0.14 * pScale) % 420;
        ctx.fillStyle = lvl.levelNum === 4 ? 'rgba(15, 23, 42, 0.85)' : (lvl.levelNum === 3 ? 'rgba(6, 78, 59, 0.72)' : (lvl.levelNum === 1 ? 'rgba(59, 29, 100, 0.65)' : 'rgba(30, 14, 68, 0.78)'));
        for (let x = offset2 - 420; x < w + 420; x += 420) {
          if (lvl.levelNum === 4) {
            // Cavern Ceiling Stalactites + Glowing Bioluminescent Crystal Spires
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 65, h * 0.38);
            ctx.lineTo(x + 130, h * 0.14);
            ctx.lineTo(x + 210, h * 0.44);
            ctx.lineTo(x + 290, h * 0.12);
            ctx.lineTo(x + 360, h * 0.34);
            ctx.lineTo(x + 420, 0);
            ctx.closePath();
            ctx.fill();

            // Glowing Cyan/Magenta Crystal Spire rising from cavern floor
            ctx.fillStyle = 'rgba(6, 182, 212, 0.32)';
            ctx.beginPath();
            ctx.moveTo(x + 140, h);
            ctx.lineTo(x + 175, h * 0.48);
            ctx.lineTo(x + 210, h);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          } else if (lvl.levelNum === 3) {
            // Stepped Mayan Jungle Pyramid silhouette + distant waterfall
            ctx.beginPath();
            ctx.moveTo(x + 40, h);
            ctx.lineTo(x + 110, h * 0.46);
            ctx.lineTo(x + 250, h * 0.46);
            ctx.lineTo(x + 320, h);
            ctx.closePath();
            ctx.fill();
            ctx.fillRect(x + 145, h * 0.34, 70, h * 0.12);
            // Shimmering waterfall stream
            ctx.fillStyle = 'rgba(125, 211, 252, 0.28)';
            ctx.fillRect(x + 355, h * 0.38, 18, h * 0.62);
            ctx.fillStyle = 'rgba(6, 78, 59, 0.72)';
          } else {
            ctx.beginPath();
            ctx.moveTo(x, h);
            ctx.lineTo(x + 140, h * 0.36);
            ctx.lineTo(x + 270, h * 0.52);
            ctx.lineTo(x + 360, h * 0.29);
            ctx.lineTo(x + 420, h);
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.restore();

        // Layer 3: Mid-ground Trees / Jungle Kapok Trees & Palm Fronds / Clockwork Gears
        ctx.save();
        const offset3 = -(camX * 0.28 * pScale) % 340;
        for (let x = offset3 - 340; x < w + 340; x += 340) {
          if (lvl.levelNum === 1 || lvl.levelNum === 3) {
            ctx.fillStyle = lvl.levelNum === 3 ? 'rgba(4, 47, 46, 0.78)' : 'rgba(34, 62, 66, 0.75)';
            ctx.fillRect(x + 120, h * 0.32, 42, h * 0.68);
            ctx.beginPath();
            ctx.arc(x + 141, h * 0.32, 95, 0, Math.PI * 2);
            ctx.fill();
            // Hanging decorative background vines in Level 3
            if (lvl.levelNum === 3) {
              ctx.strokeStyle = 'rgba(16, 185, 129, 0.38)';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(x + 80, 0);
              ctx.quadraticCurveTo(x + 140, h * 0.28, x + 210, 0);
              ctx.stroke();
            }
          } else {
            const gx = x + 170;
            const gy = h * 0.48;
            ctx.save();
            ctx.translate(gx, gy);
            ctx.rotate(t * 0.25 * (Math.floor(x / 340) % 2 === 0 ? 1 : -1));
            ctx.strokeStyle = 'rgba(217, 119, 6, 0.32)';
            ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.arc(0, 0, 74, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
        ctx.restore();

        // Layer 4: Foliage Hills & Glowing Jungle Fireflies/Lanterns
        ctx.save();
        const offset4 = -(camX * 0.48 * pScale) % 260;
        for (let x = offset4 - 260; x < w + 260; x += 260) {
          ctx.fillStyle = lvl.levelNum === 3 ? 'rgba(6, 95, 70, 0.58)' : (lvl.levelNum === 1 ? 'rgba(20, 83, 45, 0.62)' : 'rgba(59, 7, 100, 0.6)');
          ctx.beginPath();
          ctx.arc(x + 130, h + 20, 150, Math.PI, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw 2.5D PBR Animated Water Lagoons (Back wave layer + Front translucent refraction layer)
      function drawWaterPools(camX, w, lvl, t, isFrontLayer = false) {
        for (const wp of lvl.waterPools) {
          const wx = wp.x - camX;
          if (wx + wp.w < -60 || wx > w + 60) continue;

          ctx.save();
          // 2.5D Perspective Top Water Surface
          const waveAmp = isFrontLayer ? 5 : 4;
          const waveSpeed = isFrontLayer ? 3.6 : -2.4;
          const yOffset = isFrontLayer ? 6 : 0;

          const waterGrad = ctx.createLinearGradient(wx, wp.y, wx, wp.y + wp.h);
          if (!isFrontLayer) {
            waterGrad.addColorStop(0, 'rgba(6, 182, 212, 0.85)');
            waterGrad.addColorStop(1, 'rgba(8, 51, 68, 0.96)');
          } else {
            waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.52)');
            waterGrad.addColorStop(0.35, 'rgba(16, 185, 129, 0.45)');
            waterGrad.addColorStop(1, 'rgba(2, 44, 34, 0.85)');
          }

          ctx.fillStyle = waterGrad;
          ctx.beginPath();
          ctx.moveTo(wx, wp.y + wp.h);
          for (let x = 0; x <= wp.w; x += 20) {
            const wy = wp.y + yOffset + Math.sin((x + wp.x) * 0.045 + t * waveSpeed) * waveAmp;
            ctx.lineTo(wx + x, wy);
          }
          ctx.lineTo(wx + wp.w, wp.y + wp.h);
          ctx.closePath();
          ctx.fill();

          // Specular PBR Foam & Caustic Shimmer Line
          ctx.strokeStyle = isFrontLayer ? 'rgba(224, 242, 254, 0.85)' : 'rgba(103, 232, 249, 0.5)';
          ctx.lineWidth = isFrontLayer ? 3 : 2;
          ctx.beginPath();
          for (let x = 0; x <= wp.w; x += 20) {
            const wy = wp.y + yOffset + Math.sin((x + wp.x) * 0.045 + t * waveSpeed) * waveAmp;
            if (x === 0) ctx.moveTo(wx + x, wy);
            else ctx.lineTo(wx + x, wy);
          }
          ctx.stroke();
          ctx.restore();
        }
      }

      // Draw Interactive 2.5D Jungle Lianas (Vines with Leaves & Glowing Blossom Grip)
      function drawLianas(camX, w, lvl, t) {
        for (const v of lvl.lianas) {
          const ax = v.anchorX - camX;
          if (ax < -250 || ax > w + 250) continue;

          ctx.save();
          const segments = 14;
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 7;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(ax, v.anchorY);
          for (let i = 1; i <= segments; i++) {
            const frac = i / segments;
            const sag = Math.sin(frac * Math.PI) * Math.sin(v.angle) * 10;
            const sx = ax + Math.sin(v.angle) * (v.length * frac) + sag;
            const sy = v.anchorY + Math.cos(v.angle) * (v.length * frac);
            ctx.lineTo(sx, sy);
          }
          ctx.stroke();

          // PBR Highlight along the vine + Tropical Leaves along the rope
          ctx.strokeStyle = '#86efac';
          ctx.lineWidth = 2;
          ctx.stroke();

          for (let i = 2; i < segments; i += 3) {
            const frac = i / segments;
            const lx = ax + Math.sin(v.angle) * (v.length * frac);
            const ly = v.anchorY + Math.cos(v.angle) * (v.length * frac);
            ctx.save();
            ctx.translate(lx, ly);
            ctx.rotate(v.angle + (i % 2 === 0 ? 0.6 : -0.6));
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.ellipse(8, 0, 9, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Glowing Golden-Emerald Grip Knot at the tip
          const tx = v.tipX - camX;
          const ty = v.tipY;
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(tx, ty, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw Jungle Traps (Bamboo Spikes & Carnivorous Chomp Plants)
      function drawTraps(camX, w, lvl, t) {
        for (const tr of lvl.traps) {
          const tx = tr.x - camX;
          if (tx + tr.w < -60 || tx > w + 60) continue;

          ctx.save();
          if (tr.type === 'spikes') {
            const hRatio = tr.extended ? 1.0 : 0.22;
            const spikeH = tr.h * hRatio;
            const count = 4;
            const sw = tr.w / count;
            for (let i = 0; i < count; i++) {
              const sx = tx + i * sw;
              const grad = ctx.createLinearGradient(sx, tr.y - spikeH, sx + sw, tr.y);
              grad.addColorStop(0, tr.extended ? '#fef08a' : '#94a3b8');
              grad.addColorStop(1, tr.extended ? '#b45309' : '#475569');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.moveTo(sx + 2, tr.y);
              ctx.lineTo(sx + sw / 2, tr.y - spikeH);
              ctx.lineTo(sx + sw - 2, tr.y);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#451a03';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          } else if (tr.type === 'chomp_plant') {
            // Carnivorous Jungle Plant
            const cx = tx + tr.w / 2;
            const cy = tr.y - (tr.extended ? 26 : 10);
            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(cx, tr.y);
            ctx.lineTo(cx, cy);
            ctx.stroke();

            ctx.fillStyle = tr.extended ? '#e11d48' : '#9f1239';
            ctx.beginPath();
            const jawAngle = tr.extended ? 0.15 + Math.abs(Math.sin(t * 10)) * 0.45 : 0.05;
            ctx.arc(cx, cy, 18, jawAngle, Math.PI * 2 - jawAngle);
            ctx.lineTo(cx, cy);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      function drawPlatform25D(p, camX, w, lightX, lightY) {
        const sx = p.x - camX;
        if (sx + p.w < -80 || sx > w + 80) return;

        const sy = p.y;
        const depth = pbrConfig.extrudeDepth;
        const centerOffset = ((sx + p.w * 0.5) - w * 0.5) / (w * 0.5);
        const perspectiveShiftX = -centerOffset * depth * 0.85;
        const perspectiveShiftY = -depth * 0.65;

        ctx.save();

        ctx.fillStyle = 'rgba(9, 4, 20, 0.45)';
        ctx.beginPath();
        ctx.roundRect(sx + 6, sy + 10, p.w, p.h, 10);
        ctx.fill();

        const topGrad = ctx.createLinearGradient(sx, sy + perspectiveShiftY, sx, sy);
        if (p.mat === 'forest_stone') {
          topGrad.addColorStop(0, '#15803d');
          topGrad.addColorStop(1, '#4ade80');
        } else if (p.mat === 'jungle_ruins') {
          topGrad.addColorStop(0, '#047857');
          topGrad.addColorStop(1, '#34d399');
        } else if (p.mat === 'crystal_cavern') {
          topGrad.addColorStop(0, '#0e7490');
          topGrad.addColorStop(1, '#67e8f9');
        } else if (p.mat === 'clockwork_marble') {
          topGrad.addColorStop(0, '#6b21a8');
          topGrad.addColorStop(1, '#e9d5ff');
        } else {
          topGrad.addColorStop(0, '#92400e');
          topGrad.addColorStop(1, '#fbbf24');
        }
        ctx.fillStyle = topGrad;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + perspectiveShiftX, sy + perspectiveShiftY);
        ctx.lineTo(sx + p.w + perspectiveShiftX, sy + perspectiveShiftY);
        ctx.lineTo(sx + p.w, sy);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (Math.abs(perspectiveShiftX) > 1.5) {
          ctx.fillStyle = perspectiveShiftX > 0 ? 'rgba(30, 15, 55, 0.78)' : 'rgba(15, 8, 35, 0.85)';
          ctx.beginPath();
          if (perspectiveShiftX < 0) {
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + perspectiveShiftX, sy + perspectiveShiftY);
            ctx.lineTo(sx + perspectiveShiftX, sy + p.h + perspectiveShiftY);
            ctx.lineTo(sx, sy + p.h);
          } else {
            ctx.moveTo(sx + p.w, sy);
            ctx.lineTo(sx + p.w + perspectiveShiftX, sy + perspectiveShiftY);
            ctx.lineTo(sx + p.w + perspectiveShiftX, sy + p.h + perspectiveShiftY);
            ctx.lineTo(sx + p.w, sy + p.h);
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(sx, sy, p.w, p.h, 8);
        ctx.clip();

        const matCanvas = pbrMaterials[p.mat] || pbrMaterials.forest_stone;
        const pat = ctx.createPattern(matCanvas, 'repeat');
        ctx.translate(sx, sy);
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, p.w, p.h);
        ctx.translate(-sx, -sy);

        const distToLight = Math.hypot((sx + p.w * 0.5) - lightX, sy - lightY);
        if (distToLight < 480) {
          const specRadius = 260;
          const specGrad = ctx.createRadialGradient(lightX, lightY, 8, lightX, lightY, specRadius);
          const intensity = Math.min(0.55, 0.28 * pbrConfig.specularBoost * (1 - distToLight / 480));
          specGrad.addColorStop(0, `rgba(255, 248, 220, ${intensity})`);
          specGrad.addColorStop(0.5, `rgba(216, 180, 254, ${intensity * 0.45})`);
          specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = specGrad;
          ctx.fillRect(sx, sy, p.w, p.h);
        }

        const bevelGrad = ctx.createLinearGradient(sx, sy, sx, sy + p.h);
        bevelGrad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
        bevelGrad.addColorStop(0.14, 'rgba(255, 255, 255, 0.0)');
        bevelGrad.addColorStop(0.82, 'rgba(0, 0, 0, 0.0)');
        bevelGrad.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
        ctx.fillStyle = bevelGrad;
        ctx.fillRect(sx, sy, p.w, p.h);

        ctx.restore();

        ctx.strokeStyle = p.mat === 'clockwork_marble' ? 'rgba(251, 191, 36, 0.65)' : 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(sx, sy, p.w, p.h, 8);
        ctx.stroke();

        ctx.restore();
      }

      function drawEnemies(camX, w, lvl, t) {
        for (const en of lvl.enemies) {
          if (!en.alive) continue;
          const ex = en.x - camX;
          if (ex < -110 || ex > w + 110) continue;

          ctx.save();
          if (en.type === 'giant_dragonfly' || en.type === 'queen_dragonfly') {
            // ===============================================================
            // 2.5D PBR GIANT DRAGONFLY ("LIBÉLULA GIGANTE") IN THE CAVERN
            // ===============================================================
            const isQueen = en.type === 'queen_dragonfly';
            const ey = en.y;
            const scale = isQueen ? 1.28 : 1.0;

            // Draw Lock-On Attack Warning Line when Telegraphing Swoop!
            if (en.attackState === 'telegraph' && en.targetX != null) {
              ctx.save();
              ctx.strokeStyle = 'rgba(244, 63, 94, 0.75)';
              ctx.lineWidth = 2.5;
              ctx.setLineDash([6, 6]);
              ctx.beginPath();
              ctx.moveTo(ex, ey);
              ctx.lineTo(en.targetX - camX, en.targetY);
              ctx.stroke();
              ctx.restore();
            }

            ctx.translate(ex, ey);
            const facingRight = (en.attackState === 'dive' ? (en.diveVx >= 0) : (en.vx >= 0));
            if (!facingRight) ctx.scale(-1, 1);
            if (en.attackState === 'dive') {
              ctx.rotate(0.28);
            } else {
              ctx.rotate(-0.08);
            }
            ctx.scale(scale, scale);

            // Bioluminescent Aura
            const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 52);
            if (en.attackState === 'telegraph' || en.attackState === 'dive') {
              auraGrad.addColorStop(0, 'rgba(251, 113, 133, 0.55)');
              auraGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
            } else {
              auraGrad.addColorStop(0, isQueen ? 'rgba(232, 121, 249, 0.5)' : 'rgba(56, 189, 248, 0.45)');
              auraGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
            }
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 52, 0, Math.PI * 2);
            ctx.fill();

            // 4 High-Speed Fluttering Iridescent Translucent Wings
            const wingFlutter1 = Math.sin(t * 52 + en.x) * 0.38;
            const wingFlutter2 = Math.cos(t * 52 + en.x) * 0.35;
            const wingConfigs = [
              { ox: -4, oy: -6, len: 44, w: 11, ang: -2.25 + wingFlutter1 },
              { ox: -10, oy: -3, len: 38, w: 9.5, ang: -2.55 + wingFlutter2 },
              { ox: 4, oy: -8, len: 42, w: 10.5, ang: -1.85 - wingFlutter1 },
              { ox: -2, oy: -4, len: 35, w: 9, ang: -2.05 - wingFlutter2 }
            ];
            for (const wc of wingConfigs) {
              ctx.save();
              ctx.translate(wc.ox, wc.oy);
              ctx.rotate(wc.ang);
              const wGrad = ctx.createLinearGradient(0, 0, wc.len, 0);
              wGrad.addColorStop(0, 'rgba(224, 242, 254, 0.85)');
              wGrad.addColorStop(0.55, isQueen ? 'rgba(240, 171, 252, 0.65)' : 'rgba(103, 232, 249, 0.65)');
              wGrad.addColorStop(1, 'rgba(253, 224, 71, 0.45)');
              ctx.fillStyle = wGrad;
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.ellipse(wc.len * 0.5, 0, wc.len * 0.5, wc.w * 0.5, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }

            // Segmented Elongated Metallic Abdomen (Tail)
            for (let seg = 6; seg >= 1; seg--) {
              const sx = -10 - seg * 8.5;
              const sy = seg * 1.4 + Math.sin(t * 10 + seg * 0.5) * 1.2;
              const rx = 6.5 - seg * 0.45;
              const ry = 4.5 - seg * 0.25;
              ctx.fillStyle = isQueen
                ? (seg % 2 === 0 ? '#d946ef' : '#f59e0b')
                : (seg % 2 === 0 ? '#10b981' : '#06b6d4');
              ctx.strokeStyle = '#042f2e';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }

            // Armored Thorax
            const thGrad = ctx.createLinearGradient(-14, -10, 14, 10);
            thGrad.addColorStop(0, isQueen ? '#f0abfc' : '#67e8f9');
            thGrad.addColorStop(0.6, isQueen ? '#86198f' : '#0e7490');
            thGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = thGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Head & Glowing Compound Eyes
            ctx.fillStyle = isQueen ? '#a21caf' : '#0284c7';
            ctx.beginPath();
            ctx.arc(16, 1, 9.5, 0, Math.PI * 2);
            ctx.fill();

            const eyeAttack = (en.attackState === 'telegraph' || en.attackState === 'dive');
            ctx.fillStyle = en.stun > 0 ? '#93c5fd' : (eyeAttack ? '#ef4444' : '#fde047');
            ctx.beginPath();
            ctx.arc(19, -2, 5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(20.5, -2, 2.3, 0, Math.PI * 2);
            ctx.fill();

            if (isQueen) {
              ctx.fillStyle = '#fbbf24';
              ctx.font = 'bold 16px sans-serif';
              ctx.fillText('👑', 8, -14);
            }
            if (en.attackState === 'telegraph') {
              ctx.save();
              if (!facingRight) ctx.scale(-1, 1);
              ctx.fillStyle = '#fef08a';
              ctx.strokeStyle = '#dc2626';
              ctx.lineWidth = 3;
              ctx.font = 'bold 18px Fredoka, sans-serif';
              ctx.textAlign = 'center';
              ctx.strokeText('¡ATACA!', 0, -28);
              ctx.fillText('¡ATACA!', 0, -28);
              ctx.restore();
            }
          } else if (en.type === 'croc') {
            // 2.5D PBR Armored Jungle Crocodile swimming in the water!
            const ey = en.y + Math.sin(t * 4 + en.x * 0.03) * 3;
            ctx.translate(ex, ey);
            if (en.vx < 0) ctx.scale(-1, 1);

            // Armored emerald-olive back & tail ridges
            const crocGrad = ctx.createLinearGradient(0, -18, 0, 14);
            crocGrad.addColorStop(0, '#4ade80');
            crocGrad.addColorStop(0.5, '#15803d');
            crocGrad.addColorStop(1, '#052e16');
            ctx.fillStyle = crocGrad;
            ctx.beginPath();
            ctx.roundRect(-48, -10, 56, 22, 10);
            ctx.fill();

            // Dorsal spikes
            ctx.fillStyle = '#bef264';
            for (let s = -40; s <= -8; s += 12) {
              ctx.beginPath();
              ctx.moveTo(s, -10);
              ctx.lineTo(s + 5, -19);
              ctx.lineTo(s + 10, -10);
              ctx.closePath();
              ctx.fill();
            }

            // Upper Snout / Jaw (opens and snaps!)
            const jawOpenAngle = (en.mouthOpen && en.stun <= 0) ? -0.42 : -0.04;
            ctx.save();
            ctx.translate(6, -4);
            ctx.rotate(jawOpenAngle);
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.roundRect(0, -10, 42, 13, 6);
            ctx.fill();
            // Sharp white crocodile teeth
            ctx.fillStyle = '#ffffff';
            for (let tx = 8; tx <= 34; tx += 8) {
              ctx.beginPath();
              ctx.moveTo(tx, 3);
              ctx.lineTo(tx + 3, 10);
              ctx.lineTo(tx + 6, 3);
              ctx.closePath();
              ctx.fill();
            }
            ctx.restore();

            // Lower Jaw
            ctx.fillStyle = '#14532d';
            ctx.beginPath();
            ctx.roundRect(6, 2, 40, 10, 5);
            ctx.fill();

            // Glowing Reptile Eye
            ctx.fillStyle = en.stun > 0 ? '#93c5fd' : '#facc15';
            ctx.beginPath();
            ctx.arc(4, -12, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.fillRect(3, -16, 2, 8);
          } else {
            const ey = en.y + Math.sin(t * 6 + en.x * 0.05) * 3;
            ctx.translate(ex, ey);
            if (en.vx > 0) ctx.scale(-1, 1);

            const rad = en.type === 'maestro' ? 30 : 22;
            const bodyGrad = ctx.createRadialGradient(-6, -8, 3, 0, 0, rad);
            if (en.type === 'snake') {
              bodyGrad.addColorStop(0, '#4ade80');
              bodyGrad.addColorStop(0.6, '#15803d');
              bodyGrad.addColorStop(1, '#064e3b');
            } else if (en.type === 'piranha') {
              bodyGrad.addColorStop(0, '#fb7185');
              bodyGrad.addColorStop(0.6, '#e11d48');
              bodyGrad.addColorStop(1, '#4c0519');
            } else if (en.type === 'toucan' || en.type === 'wasp') {
              bodyGrad.addColorStop(0, '#fde047');
              bodyGrad.addColorStop(0.6, '#ca8a04');
              bodyGrad.addColorStop(1, '#1e1b4b');
            } else if (en.type === 'owl' || en.type === 'maestro') {
              bodyGrad.addColorStop(0, '#c084fc');
              bodyGrad.addColorStop(0.6, '#581c87');
              bodyGrad.addColorStop(1, '#1e1b4b');
            } else {
              bodyGrad.addColorStop(0, '#64748b');
              bodyGrad.addColorStop(0.6, '#1e293b');
              bodyGrad.addColorStop(1, '#020617');
            }
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.arc(0, 0, rad, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = en.stun > 0 ? '#fde047' : 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Beak / Snout
            ctx.fillStyle = en.type === 'toucan' ? '#f97316' : '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(-rad + 2, -4);
            ctx.lineTo(-rad - (en.type === 'toucan' ? 20 : 12), 3);
            ctx.lineTo(-rad + 2, 9);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-8, -5, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(-10, -5, 3, 0, Math.PI * 2);
            ctx.fill();

            if (en.type === 'maestro') {
              ctx.fillStyle = '#fbbf24';
              ctx.font = 'bold 16px sans-serif';
              ctx.fillText('👑', -10, -rad - 4);
            }
          }
          ctx.restore();
        }
      }

      function renderGame() {
        const w = canvas.width;
        const h = canvas.height;
        const camX = gameState.cameraX;
        const lvl = gameState.level;
        const t = gameState.time;

        // 1. Multi-layer Parallax Scenery
        drawParallaxBackground(w, h, camX, lvl, t);

        // 2. Back Water Layer
        drawWaterPools(camX, w, lvl, t, false);

        // 3. Swinging Jungle Lianas
        drawLianas(camX, w, lvl, t);

        const lightScreenX = (player.x + player.w * 0.5) - camX;
        const lightScreenY = player.y + player.h * 0.35;

        // 4. 2.5D PBR Platforms
        for (const p of lvl.platforms) {
          drawPlatform25D(p, camX, w, lightScreenX, lightScreenY);
        }

        // 5. Jungle Traps (Spikes & Carnivorous Plants)
        drawTraps(camX, w, lvl, t);

        // 6. Bounce Pads
        for (const bp of lvl.bouncePads) {
          const bx = bp.x - camX;
          if (bx + bp.w < -50 || bx > w + 50) continue;
          const squeeze = bp.bounceAnim ? Math.sin(bp.bounceAnim * Math.PI) * 8 : 0;
          ctx.save();
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.roundRect(bx, bp.y + squeeze, bp.w, bp.h - squeeze, 8);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.ellipse(bx + bp.w / 2, bp.y + squeeze, bp.w / 2, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }

        // 7. Checkpoints
        for (const cp of lvl.checkpoints) {
          const cx = cp.x - camX;
          if (cx < -60 || cx > w + 60) continue;
          ctx.save();
          ctx.strokeStyle = cp.active ? '#fbbf24' : '#94a3b8';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(cx, cp.y + 65);
          ctx.lineTo(cx, cp.y + 15);
          ctx.stroke();
          ctx.fillStyle = cp.active ? '#f59e0b' : '#475569';
          ctx.beginPath();
          ctx.roundRect(cx - 20, cp.y, 40, 22, 5);
          ctx.fill();
          if (cp.active) {
            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 16px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('𝄞', cx, cp.y - 8 + Math.sin(t * 4) * 4);
          }
          ctx.restore();
        }

        // 8. Collectibles (Notes & Clefs)
        for (const n of lvl.notes) {
          if (n.collected) continue;
          const nx = n.x - camX;
          if (nx < -40 || nx > w + 40) continue;
          const ny = n.y + Math.sin(t * 3.8 + n.phase) * 6;
          ctx.save();
          const g = ctx.createRadialGradient(nx, ny, 2, nx, ny, 22);
          g.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
          g.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(nx, ny, 22, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.strokeStyle = '#92400e';
          ctx.lineWidth = 3;
          ctx.font = 'bold 24px Fredoka, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.strokeText('♪', nx, ny);
          ctx.fillText('♪', nx, ny);
          ctx.restore();
        }

        for (const c of lvl.clefs) {
          if (c.collected) continue;
          const cx = c.x - camX;
          if (cx < -60 || cx > w + 60) continue;
          const cy = c.y + Math.sin(t * 3 + c.id) * 8;
          ctx.save();
          const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 36);
          g.addColorStop(0, 'rgba(240, 171, 252, 0.95)');
          g.addColorStop(0.5, 'rgba(192, 132, 252, 0.45)');
          g.addColorStop(1, 'rgba(192, 132, 252, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, 36, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f5d0fe';
          ctx.strokeStyle = '#581c87';
          ctx.lineWidth = 4;
          ctx.font = 'bold 34px Fredoka, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.strokeText('𝄞', cx, cy);
          ctx.fillText('𝄞', cx, cy);
          ctx.restore();
        }

        // 9. Goal Portal or Final Treasure Chest
        const g = lvl.goal;
        const gx = g.x - camX;
        if (gx > -160 && gx < w + 160) {
          ctx.save();
          const glow = ctx.createRadialGradient(gx + g.w / 2, g.y + g.h / 2, 10, gx + g.w / 2, g.y + g.h / 2, 95);
          glow.addColorStop(0, 'rgba(253, 224, 71, 0.95)');
          glow.addColorStop(0.5, 'rgba(192, 132, 252, 0.5)');
          glow.addColorStop(1, 'rgba(192, 132, 252, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(gx + g.w / 2, g.y + g.h / 2, 95, 0, Math.PI * 2);
          ctx.fill();

          if (g.type === 'portal') {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(gx + g.w / 2, g.y + g.h / 2, 46, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#fde047';
            ctx.font = 'bold 42px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('𝄞', gx + g.w / 2, g.y + g.h / 2);
          } else {
            const cx = gx + 15;
            const cy = g.y + 20;
            const cw = 92;
            const ch = 68;
            ctx.fillStyle = '#7e22ce';
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cw, ch, 12);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(cx + 16, cy, 10, ch);
            ctx.fillRect(cx + cw - 26, cy, 10, ch);
            ctx.fillRect(cx, cy + 26, cw, 8);
            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 28px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('👑', cx + cw / 2, cy - 10 + Math.sin(t * 4) * 4);
            ctx.fillText('𝄞', cx + cw / 2, cy + 44);
          }

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 13px Fredoka, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(g.title, gx + g.w / 2, g.y - 12);
          ctx.restore();
        }

        // 10. Enemies (including Crocodiles in water, Piranhas, Snakes, Toucans)
        drawEnemies(camX, w, lvl, t);

        // 11. Front Translucent Water Refraction Layer (partially submerges crocodiles!)
        drawWaterPools(camX, w, lvl, t, true);

        // 12. Soundwave Projectiles
        for (const sw of gameState.soundWaves) {
          const sx = sw.x - camX;
          ctx.save();
          ctx.strokeStyle = '#e879f9';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(sx, sw.y, sw.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 22px Fredoka, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('𝄞', sx, sw.y);
          ctx.restore();
        }

        // 13. Protagonist: PETRONIA (with studio-cleaned sprites!)
        drawPetronia(camX, t);

        // 14. Particles & Floating Score Popups
        for (const pt of gameState.particles) {
          const px = pt.x - camX;
          ctx.save();
          ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
          if (pt.note) {
            ctx.fillStyle = pt.color;
            ctx.font = 'bold 16px Fredoka, sans-serif';
            ctx.fillText(pt.note, px, pt.y);
          } else {
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(px, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        for (const ft of gameState.floatingTexts) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, ft.life);
          ctx.font = 'bold 15px Fredoka, sans-serif';
          ctx.fillStyle = ft.color;
          ctx.strokeStyle = '#1e1b4b';
          ctx.lineWidth = 3;
          ctx.textAlign = 'center';
          ctx.strokeText(ft.text, ft.x - camX, ft.y);
          ctx.fillText(ft.text, ft.x - camX, ft.y);
          ctx.restore();
        }

        // 15. Foreground Parallax Layer 6
        ctx.save();
        const fgOffset = -(camX * 1.28 * pbrConfig.parallaxScale) % 480;
        ctx.fillStyle = 'rgba(10, 5, 24, 0.42)';
        for (let x = fgOffset - 480; x < w + 480; x += 480) {
          ctx.beginPath();
          ctx.arc(x + 60, h + 30, 75, Math.PI, Math.PI * 2);
          ctx.arc(x + 140, h + 40, 65, Math.PI, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      function drawPetronia(camX, t) {
        const px = player.x - camX;
        const py = player.y;

        ctx.save();

        if (!player.attachedLiana) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
          ctx.beginPath();
          ctx.ellipse(px + player.w / 2, py + player.h - 2, 24, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        const aura = ctx.createRadialGradient(
          px + player.w / 2,
          py + player.h / 2,
          8,
          px + player.w / 2,
          py + player.h / 2,
          75
        );
        aura.addColorStop(0, 'rgba(232, 121, 249, 0.28)');
        aura.addColorStop(1, 'rgba(232, 121, 249, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(px + player.w / 2, py + player.h / 2, 75, 0, Math.PI * 2);
        ctx.fill();

        if (player.invulnTimer > 0 && Math.floor(t * 16) % 2 === 0) {
          ctx.globalAlpha = 0.55;
        }

        const drawW = 78;
        const drawH = 104;
        const centerX = px + player.w / 2;
        const centerY = py + player.h - drawH / 2 + 4;

        ctx.translate(centerX, centerY);
        if (player.attachedLiana) {
          ctx.rotate(-player.attachedLiana.angle * 0.65);
        }
        if (player.facing === -1) {
          ctx.scale(-1, 1);
        }

        const walkImg = sprites.walk;
        const idleImg = sprites.threeQuarter;
        const jumpImg = sprites.celebrate;

        if (player.celebrating || !player.onGround || player.attachedLiana) {
          if (jumpImg && jumpImg.complete && jumpImg.naturalWidth > 0) {
            const tilt = (!player.onGround && !player.attachedLiana) ? Math.max(-0.22, Math.min(0.22, player.vy * 0.0004)) : 0;
            ctx.rotate(tilt);
            ctx.drawImage(jumpImg, -drawW * 0.54, -drawH * 0.5, drawW * 1.08, drawH);
          }
        } else if (Math.abs(player.vx) > 20 && walkImg && walkImg.complete && walkImg.naturalWidth > 0) {
          const frameCount = 8;
          const fw = walkImg.naturalWidth / frameCount;
          const fh = walkImg.naturalHeight;
          const sx = (player.walkFrame % frameCount) * fw;
          ctx.drawImage(walkImg, sx, 0, fw, fh, -drawW * 0.5, -drawH * 0.5, drawW, drawH);
        } else if (idleImg && idleImg.complete && idleImg.naturalWidth > 0) {
          const breathe = 1 + Math.sin(t * 4) * 0.025;
          ctx.scale(1, breathe);
          ctx.drawImage(idleImg, -drawW * 0.46, -drawH * 0.5, drawW * 0.92, drawH);
        }

        ctx.restore();
      }

      // =========================================================================
      // 8. HUD, MODALS, RESIZE & INPUT EVENT LISTENERS
      // =========================================================================
      function updateHUD() {
        const lvl = gameState.level;
        const collectedNotes = lvl.notes.filter(n => n.collected).length;
        const collectedClefs = lvl.clefs.filter(c => c.collected).length;

        document.getElementById('hudNotes').textContent = `${collectedNotes} / ${lvl.notes.length}`;
        document.getElementById('hudClefs').textContent = `${collectedClefs} / ${lvl.clefs.length}`;
        document.getElementById('hudScore').textContent = String(gameState.score).padStart(4, '0');
        document.getElementById('hudLevelTitle').textContent = lvl.name;
        document.getElementById('hudHarmonyBar').style.width = `${Math.round(player.harmony)}%`;

        const heartsEl = document.getElementById('hudHearts');
        let heartsHtml = '';
        for (let i = 0; i < player.maxHp; i++) {
          heartsHtml += i < player.hp ? '<span>❤️</span>' : '<span class="opacity-30">🖤</span>';
        }
        heartsEl.innerHTML = heartsHtml;
      }

      function updateLevelButtons() {
        const btns = [
          { el: document.getElementById('btnLevel1'), num: 1 },
          { el: document.getElementById('btnLevel2'), num: 2 },
          { el: document.getElementById('btnLevel3'), num: 3 },
          { el: document.getElementById('btnLevel4'), num: 4 }
        ];
        btns.forEach(b => {
          if (!b.el) return;
          if (gameState.levelNum === b.num) {
            b.el.classList.add('ring-2', 'ring-amber-400');
            b.el.classList.remove('opacity-85');
          } else {
            b.el.classList.remove('ring-2', 'ring-amber-400');
            b.el.classList.add('opacity-85');
          }
        });
      }

      function showStatusModal(title, desc, primaryLabel) {
        const lvl = gameState.level;
        const collectedNotes = lvl.notes.filter(n => n.collected).length;
        const collectedClefs = lvl.clefs.filter(c => c.collected).length;
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalDesc').textContent = desc;
        document.getElementById('btnModalPrimary').textContent = primaryLabel;
        document.getElementById('statNotes').textContent = `${collectedNotes}/${lvl.notes.length}`;
        document.getElementById('statClefs').textContent = `${collectedClefs}/${lvl.clefs.length}`;
        document.getElementById('statScore').textContent = gameState.score;
        document.getElementById('statusModal').classList.remove('hidden');
      }

      function hideStatusModal() {
        document.getElementById('statusModal').classList.add('hidden');
      }

      let introTimer;

      function clearInputs() {
        keys.left = keys.right = keys.up = false;
        document.querySelectorAll('.touch-btn.active').forEach((button) => button.classList.remove('active'));
      }

      function startLevel(lvlNum, keepScore = false) {
        clearTimeout(introTimer);
        introSound.stopMusic();
        clearInputs();
        document.body.dataset.screen = 'game';
        hideStatusModal();
        resetPlayerForLevel(lvlNum, keepScore);
        gameState.mode = 'playing';
        sound.init();
        canvas.focus({ preventScroll: true });
        window.scrollTo(0, 0);
      }

      function bindClick(id, fn) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
      }

      // Interactive Cover Screen & Level Button Bindings
      bindClick('btnStartGame', () => {
        if (document.body.dataset.screen !== 'intro') return;
        document.body.dataset.screen = 'intro-playing';
        introSound.startIntroMusic();
        document.getElementById('btnSkipIntro').focus({ preventScroll: true });
        introTimer = setTimeout(() => startLevel(1), 5600);
      });
      bindClick('btnSkipIntro', () => startLevel(1));
      bindClick('btnLevel1', () => startLevel(1, false));
      bindClick('btnLevel2', () => startLevel(2, false));
      bindClick('btnLevel3', () => startLevel(3, false));
      bindClick('btnLevel4', () => startLevel(4, false));

      function showCover() {
        clearInputs();
        gameState.mode = 'start';
        hideStatusModal();
        document.body.dataset.screen = 'intro';
        document.getElementById('btnStartGame').focus({ preventScroll: true });
        window.scrollTo(0, 0);
      }
      bindClick('btnShowCover', showCover);
      bindClick('btnModalCover', showCover);

      bindClick('btnModalPrimary', () => {
        if (gameState.mode === 'level_complete') {
          const nextLvl = gameState.levelNum === 1 ? 2 : (gameState.levelNum === 2 ? 3 : 4);
          startLevel(nextLvl, true);
        } else if (gameState.mode === 'paused') {
          hideStatusModal();
          gameState.mode = 'playing';
        } else {
          startLevel(1, false);
        }
      });

      bindClick('btnModalRestart', () => {
        startLevel(gameState.levelNum, false);
      });

      bindClick('btnPause', () => {
        if (gameState.mode === 'playing') {
          clearInputs();
          gameState.mode = 'paused';
          showStatusModal(
            'Juego en Pausa',
            'Cambia entre el Bosque (Nivel 1), las Cumbres (Nivel 2), la Selva (Nivel 3) y la Cueva de las Libélulas Gigantes (Nivel 4).',
            '▶ Continuar'
          );
        } else if (gameState.mode === 'paused') {
          hideStatusModal();
          gameState.mode = 'playing';
        }
      });

      bindClick('btnAudioToggle', () => {
        const isOn = sound.toggle();
        document.getElementById('btnAudioToggle').setAttribute('aria-pressed', String(isOn));
        document.getElementById('audioIcon').textContent = isOn ? '🔊' : '🔇';
        document.getElementById('audioLabel').textContent = isOn ? 'Efectos ON' : 'Efectos OFF';
      });

      const shareDialog = document.getElementById('shareAppModal');
      const shareUrl = document.getElementById('shareUrl');
      const shareFeedback = document.getElementById('shareFeedbackMsg');
      const whatsapp = document.getElementById('btnShareWhatsApp');
      const nativeShare = document.getElementById('btnNativeShare');
      const shareData = {
        title: 'Sparrow’s Tale: Petronia and the Hidden Treasure',
        url: document.querySelector('link[rel="canonical"]').href
      };

      function openShare() {
        clearInputs();
        shareUrl.value = shareData.url;
        shareFeedback.textContent = '';
        whatsapp.href = 'https://wa.me/?text=' + encodeURIComponent(shareData.title + '\n' + shareData.url);
        nativeShare.hidden = !navigator.share;
        shareDialog.showModal();
      }
      bindClick('btnShareApp', openShare);
      bindClick('btnOpenShareFromCover', openShare);

      async function copyLink() {
        try {
          await navigator.clipboard.writeText(shareData.url);
          shareFeedback.textContent = 'Enlace copiado.';
        } catch {
          shareUrl.select();
          shareFeedback.textContent = 'Selecciona Copiar para guardar el enlace.';
        }
      }
      bindClick('btnCopyLink', copyLink);
      bindClick('btnNativeShare', async () => {
        try {
          await navigator.share(shareData);
        } catch (error) {
          if (error.name !== 'AbortError') await copyLink();
        }
      });

      document.getElementById('btnPbrSettings').addEventListener('click', () => {
        document.getElementById('pbrPanel').classList.toggle('hidden');
      });
      document.getElementById('btnClosePbr').addEventListener('click', () => {
        document.getElementById('pbrPanel').classList.add('hidden');
      });

      document.getElementById('sliderNormal').addEventListener('input', (e) => {
        pbrConfig.normalStrength = Number(e.target.value) / 100;
      });
      document.getElementById('sliderSpecular').addEventListener('input', (e) => {
        pbrConfig.specularBoost = Number(e.target.value) / 100;
      });
      document.getElementById('sliderDepth').addEventListener('input', (e) => {
        pbrConfig.extrudeDepth = Number(e.target.value);
      });
      document.getElementById('sliderParallax').addEventListener('input', (e) => {
        pbrConfig.parallaxScale = Number(e.target.value) / 100;
      });

      window.addEventListener('keydown', (e) => {
        if (gameState.mode !== 'playing' || shareDialog.open || e.target.matches('input, select, textarea')) return;
        if (e.code === 'Space' && e.target.closest('button, a')) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
          if (!keys.up) triggerJump();
          keys.up = true;
        }
        if (e.code === 'KeyX' || e.code === 'KeyJ') {
          triggerMusicalWave();
        }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyK') {
          triggerDash();
        }
      });

      window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keys.up = false;
      });

      function bindHoldButton(btnId, keyName, onPress) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        const start = (e) => {
          e.preventDefault();
          btn.classList.add('active');
          if (keyName) keys[keyName] = true;
          if (onPress) onPress();
        };
        const end = (e) => {
          e.preventDefault();
          btn.classList.remove('active');
          if (keyName) keys[keyName] = false;
        };
        btn.addEventListener('pointerdown', start);
        btn.addEventListener('pointerup', end);
        btn.addEventListener('pointerleave', end);
        btn.addEventListener('pointercancel', end);
      }

      bindHoldButton('touchLeft', 'left');
      bindHoldButton('touchRight', 'right');
      bindHoldButton('touchJump', 'up', triggerJump);
      bindHoldButton('touchWave', null, triggerMusicalWave);
      bindHoldButton('touchDash', null, triggerDash);

      function resizeCanvas() {
        const container = document.getElementById('viewportContainer');
        if (!container) return;
        canvas.width = 960;
        canvas.height = 540;
        renderGame();
      }

      window.addEventListener('resize', resizeCanvas);
      window.addEventListener('blur', clearInputs);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          clearInputs();
          introSound.stopMusic();
        }
      });

      let lastTime = performance.now();
      function loop(now) {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        if (gameState.mode !== 'start' && !shareDialog.open) updateGame(dt);
        if (gameState.mode !== 'start') renderGame();
        requestAnimationFrame(loop);
      }

      window.onload = function () {
        resizeCanvas();
        updateHUD();
        requestAnimationFrame(loop);
      };
      if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
        void navigator.serviceWorker.register('./sw.js').catch(() => {});
      }
    })();
