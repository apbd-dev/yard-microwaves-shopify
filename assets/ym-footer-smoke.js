/* YM smoke footer (sections/ym-footer-smoke.liquid, #127).
   Three jobs, all skipped under prefers-reduced-motion:
   1. A bank of smoke covers the footer. Once a quarter of the footer is on
      screen, the smoke rolls away over REVEAL_MS, so every visitor sees it
      whatever the page length or scroll speed. It stays clear for the page
      view. Focus inside the footer clears it at once, and so does selecting
      the footer in the theme editor.
   2. Soft smoke drifts up behind the footer content.
   3. The background loop plays only while the footer is on screen.
   Both canvases render at half resolution and stop when off screen. */
(() => {
  if (customElements.get('ym-smoke-footer')) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const REVEAL_MS = 2600;
  const REVEAL_AT = 0.25; // share of the footer on screen that starts the reveal

  function puffSprite(size, puffs, inner, mid) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    for (let i = 0; i < puffs; i++) {
      const x = size / 2 + (Math.random() - 0.5) * size * 0.4;
      const y = size / 2 + (Math.random() - 0.5) * size * 0.3;
      const r = size * (0.17 + Math.random() * 0.2);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, inner);
      gr.addColorStop(0.5, mid);
      gr.addColorStop(1, 'rgba(200,190,176,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    return c;
  }

  class YmSmokeFooter extends HTMLElement {
    connectedCallback() {
      this.visible = false;
      this.cleared = false;
      this.p = 0;
      this.time = 0;
      this.revealStart = 0;
      this.video = this.querySelector('.ym-sf__video, .ym-sf__bg video');
      this.coverCv = this.querySelector('.ym-sf__cover');
      this.ambientCv = this.querySelector('.ym-sf__ambient');

      this.useCover = this.dataset.smokeCover === 'true' && !reduce.matches;
      this.useAmbient = this.dataset.smokeAmbient === 'true' && !reduce.matches;

      this.onResize = () => { this.size(); this.requestTick(); };
      this.onFocus = () => this.clearNow();
      // In the theme editor, selecting the footer (or one of its blocks) clears the smoke so it can be edited.
      this.onEditorSelect = (e) => { if (e.target && (e.target === this || e.target.contains(this) || this.contains(e.target))) this.clearNow(); };

      if (this.useCover) {
        this.classList.add('is-armed');
        this.coverSprite = puffSprite(200, 9, 'rgba(236,230,220,.62)', 'rgba(214,206,194,.3)');
        this.addEventListener('focusin', this.onFocus);
        document.addEventListener('shopify:section:select', this.onEditorSelect);
        document.addEventListener('shopify:block:select', this.onEditorSelect);
      } else {
        this.classList.add('is-clear');
      }
      if (this.useAmbient) this.ambientSprites = [0, 1, 2].map(() => puffSprite(256, 7, 'rgba(225,215,200,.55)', 'rgba(210,200,185,.22)'));
      window.addEventListener('resize', this.onResize, { passive: true });
      this.ro = new ResizeObserver(() => this.onResize());
      this.ro.observe(this);

      this.io = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.useCover && !this.cleared && !this.revealStart && entry.intersectionRatio >= REVEAL_AT) {
          this.revealStart = performance.now();
        }
        if (this.video) {
          if (this.visible && !reduce.matches) this.video.play().catch(() => {});
          else this.video.pause();
        }
        if (this.visible) this.start();
      }, { threshold: [0, REVEAL_AT, 0.5] });
      this.io.observe(this);

      this.size();
      this.requestTick();
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this.onResize);
      this.removeEventListener('focusin', this.onFocus);
      document.removeEventListener('shopify:section:select', this.onEditorSelect);
      document.removeEventListener('shopify:block:select', this.onEditorSelect);
      if (this.io) this.io.disconnect();
      if (this.ro) this.ro.disconnect();
      this.running = false;
    }

    /* ---------- sizes and particles ---------- */
    size() {
      const w = this.clientWidth, h = this.clientHeight;
      if (!w || !h) return;
      const W = Math.round(w / 2), H = Math.round(h / 2);
      if (this.useCover && !this.cleared) {
        this.coverCv.width = W;
        this.coverCv.height = H;
        const n = Math.round((W * H) / 2600) + 40;
        this.cover = Array.from({ length: n }, () => {
          const x = Math.random() * W, y = Math.random() * H;
          return {
            x, y,
            s: H * (0.45 + Math.random() * 0.6),
            rot: Math.random() * 6.28,
            vr: (Math.random() - 0.5) * 0.08,
            ang: Math.atan2(y - H / 2, x - W / 2) + (Math.random() - 0.5) * 0.8,
            out: 0.7 + Math.random() * 0.8,
            ph: Math.random() * 6.28,
            a: 0.5 + Math.random() * 0.5,
            late: Math.random(),
          };
        });
      }
      if (this.useAmbient) {
        this.ambientCv.width = W;
        this.ambientCv.height = H;
        const make = (y) => ({
          x: Math.random() * W,
          y: y === undefined ? Math.random() * H : y,
          s: 110 + Math.random() * 190,
          a: 0.05 + Math.random() * 0.09,
          vy: 4 + Math.random() * 8,
          ph: Math.random() * 6.28,
          sp: this.ambientSprites[(Math.random() * 3) | 0],
          rot: Math.random() * 6.28,
          vr: (Math.random() - 0.5) * 0.05,
        });
        this.makeAmbient = make;
        this.ambient = Array.from({ length: Math.round((W * H) / 13000) + 8 }, () => make());
      }
      this.W = W;
      this.H = H;
    }

    /* ---------- reveal ---------- */
    requestTick() {
      if (this.tickQueued) return;
      this.tickQueued = true;
      requestAnimationFrame(() => {
        this.tickQueued = false;
        if (!this.useCover || this.cleared) return;
        this.start();
      });
    }

    clearNow() {
      if (this.cleared) return;
      this.cleared = true;
      this.p = 1;
      this.classList.add('is-clear');
      const ctx = this.coverCv.getContext('2d');
      ctx.clearRect(0, 0, this.coverCv.width, this.coverCv.height);
      this.coverCv.hidden = true;
    }

    /* ---------- drawing ---------- */
    start() {
      if (this.running || !this.visible) return;
      if ((!this.useCover || this.cleared) && !this.useAmbient) return;
      this.running = true;
      this.last = performance.now();
      const loop = (now) => {
        if (!this.running) return;
        const dt = Math.min(0.05, (now - this.last) / 1000);
        this.last = now;
        this.time += dt;
        if (this.useCover && !this.cleared) {
          if (this.revealStart) {
            const k = clamp((now - this.revealStart) / REVEAL_MS);
            this.p = k * k * (3 - 2 * k);
            if (k >= 1) this.clearNow();
          }
          if (!this.cleared) this.drawCover();
        }
        if (this.useAmbient) this.drawAmbient(dt);
        if (this.visible && ((this.useCover && !this.cleared) || this.useAmbient)) requestAnimationFrame(loop);
        else this.running = false;
      };
      requestAnimationFrame(loop);
    }

    drawCover() {
      const ctx = this.coverCv.getContext('2d'), W = this.W, H = this.H, p = this.p;
      if (!this.cover) return;
      ctx.clearRect(0, 0, W, H);
      const base = Math.pow(clamp(1 - p * 1.2), 1.2);
      if (base > 0) {
        ctx.fillStyle = `rgba(206,199,188,${(0.94 * base).toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      }
      const diag = Math.hypot(W, H), t = this.time;
      for (const q of this.cover) {
        const k = clamp((p - q.late * 0.25) / 0.8), e = k * k * (3 - 2 * k);
        const a = q.a * (1 - e) * (1 - e);
        if (a < 0.01) continue;
        const x = q.x + Math.cos(q.ang) * e * diag * 0.55 * q.out + Math.sin(t * 0.35 + q.ph) * 5;
        const y = q.y + Math.sin(q.ang) * e * diag * 0.45 * q.out - e * 20 + Math.cos(t * 0.3 + q.ph) * 4;
        const sz = q.s * (1 + e * 0.6);
        ctx.globalAlpha = a;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(q.rot + t * q.vr);
        ctx.drawImage(this.coverSprite, -sz / 2, -sz / 2, sz, sz);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    drawAmbient(dt) {
      const ctx = this.ambientCv.getContext('2d'), W = this.W, H = this.H;
      if (!this.ambient) return;
      ctx.clearRect(0, 0, W, H);
      for (const q of this.ambient) {
        q.y -= q.vy * dt;
        q.ph += dt * 0.3;
        q.x += Math.sin(q.ph) * 3 * dt;
        q.s += 2 * dt;
        q.rot += q.vr * dt;
        if (q.y < -q.s * 0.6) Object.assign(q, this.makeAmbient(H + q.s * 0.4));
        const fade = Math.min(1, (H - q.y) / (H * 0.35) + 0.2) * Math.min(1, (q.y + q.s * 0.5) / (H * 0.4));
        ctx.globalAlpha = q.a * Math.max(0, fade);
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(q.rot);
        ctx.drawImage(q.sp, -q.s / 2, -q.s / 2, q.s, q.s);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }

  customElements.define('ym-smoke-footer', YmSmokeFooter);
})();
