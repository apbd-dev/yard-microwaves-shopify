// import { Component } from '@theme/component'
// import Splide from '@theme/splide'
// import { ThemeEvents } from '@theme/events'
// import { scheduler } from '@theme/utilities'

// class CrossellCart extends Component {
//   #splide = null
//   #observer = null
//   #isInitialized = false

//   connectedCallback() {
//     super.connectedCallback()

//     this.#observer = new IntersectionObserver((entries) => {
//       for (const entry of entries) {
//         if (entry.isIntersecting && !this.#isInitialized) {
//           this.#observer.disconnect()
//           this.#isInitialized = true
//           this.#handleCartUpdate()
//         }
//       }
//     }, { threshold: 0.1, rootMargin: '50px' })

//     this.#observer.observe(this)
//     document.addEventListener(ThemeEvents.cartUpdate, this.#handleCartUpdate)
//   }

//   disconnectedCallback() {
//     super.disconnectedCallback()
//     this.#cleanup()
//   }

//   updatedCallback() {
//     super.updatedCallback()
//     this.#destroySplide()

//     scheduler.schedule(() => {
//       try {
//         this.#initializeSplide()
//       } catch (error) {
//         console.error("[CrossellCart] Error inicializando Splide:", error)
//       }
//     })
//   }

//   #handleCartUpdate = () => {
//     if (this.isConnected) {
//       this.updatedCallback()
//     }
//   }

//   #initializeSplide() {
//     const { splide, track, list, slides } = this.refs

//     if (!splide || !track || !list || !slides?.length) {
//       console.warn("[CrossellCart] Estructura de Splide incompleta")
//       return
//     }

//     this.#splide = new Splide(splide, {
//       perPage: 1,
//       gap: "1rem",
//       pagination: false,
//       arrows: slides.length > 1,
//       breakpoints: {
//         768: { perPage: 1 }
//       }
//     })

//     this.#splide.mount()
//   }

//   #destroySplide() {
//     if (this.#splide?.state?.is(Splide.STATES.MOUNTED)) {
//       this.#splide.destroy()
//     }
//     this.#splide = null
//   }

//   #cleanup() {
//     this.#destroySplide()
//     this.#observer?.disconnect()
//     document.removeEventListener(ThemeEvents.cartUpdate, this.#handleCartUpdate)
//     this.#isInitialized = false
//   }
// }

// customElements.define('crossell-cart', CrossellCart)