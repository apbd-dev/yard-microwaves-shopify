import Splide from '@theme/splide';
import { Component } from '@theme/component'
class SocialInstagramSplide extends Component {
    #splide = null

    connectedCallback() {
        super.connectedCallback();
        this.#initializeSplide();
    }

    #initializeSplide() {
        const { splide } = this.refs

        console.log(splide)
        const gridColumns = this.dataset.gridColumns || 4;
        const spacingHorizontalGrid = this.dataset.spacingHorizontalGrid || 4;
        const splideOptions = {
            perPage: gridColumns,
            breakpoints: {
                1160: { perPage: 4 },
                1024: { perPage: 3 },
                748: { perPage: 2 },
            },
            drag: true,
            gap: `${spacingHorizontalGrid}px`,
        };

        this.#splide = new Splide(splide, splideOptions)

        this.#splide.mount()
    }
}

customElements.define('social-instagram-splide', SocialInstagramSplide)