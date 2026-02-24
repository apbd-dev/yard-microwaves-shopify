import { Component } from '@theme/component'
import { ThemeEvents } from '@theme/events'
import confetti from '@theme/confetti'

class FreeShippingProgressBar extends Component { 
  connectedCallback() {    
    this._shippingComplete = this.shippingComplete.bind(this)
    document.addEventListener(ThemeEvents.cartUpdate, this._shippingComplete)
  }

  shippingComplete(event){
    const { sections } = event.detail?.data
    const [key, html] = Object.entries(sections)[0]
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    const progressBarHTML = doc.querySelector("free-shipping-progress-bar")
    const progress = progressBarHTML.dataset.currentProgress
    console.log(progress)
    

      if (!window.celebrityAnimation) {
        requestAnimationFrame(() => {
          if (progress >= 100) {
            this.launchCrazyConfetti();
            window.celebrityAnimation = 1;
          }
        });
      }
  }

  launchCrazyConfetti() {
    const cartCanvas = document.querySelector('#cart-confetti-canvas')  

    const myConfetti = confetti.create(cartCanvas, { resize: true, useWorker: true });
    const duration = 1 * 500; // 5 segundos
    const end = Date.now() + duration;
    (function frame() {
      myConfetti({
        particleCount: 250,
        startVelocity: 60,
        spread: 360,
        scalar: 1.3,
        origin: {
          x: Math.random(),
          y: Math.random() - 0.2,
        },
        colors: ['#ff6f61', '#ffd166', '#06d6a0', '#118ab2', '#ef476f'],
        shapes: ['circle', 'square'],
        zIndex: 99999
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }

  disconnectedCallback() {
    document.removeEventListener(ThemeEvents.cartUpdate, this._shippingComplete)
  }
}

customElements.define('free-shipping-progress-bar', FreeShippingProgressBar)