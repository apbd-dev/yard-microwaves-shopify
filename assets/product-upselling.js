import { Component } from '@theme/component';
import { ThemeEvents, VariantUpdateEvent } from '@theme/events';

class ProductUpsellOptions extends Component {
  connectedCallback() {
    this.closestSection = this.closest('.shopify-section, dialog');
    if (!this.closestSection) return;

    // Guardamos referencia para poder removerla después
    this.boundUpdate = this.updateUpsells.bind(this);
    this.closestSection.addEventListener(ThemeEvents.variantUpdate, this.boundUpdate);
    
    this.selectorOption();
  }

  disconnectedCallback() {
    if (this.closestSection && this.boundUpdate) {
      this.closestSection.removeEventListener(ThemeEvents.variantUpdate, this.boundUpdate);
    }
  }

  /**
  * Updates the price.
  * @param {VariantUpdateEvent} event - The variant update event.
  */
  updateUpsells(event) {
    const newUpselling = event.detail.data.html.querySelector('product-upsell-options');
    if (newUpselling && this.innerHTML !== newUpselling.innerHTML) {
      this.replaceWith(newUpselling);
    }
  }


  selectorOption() {
    const options = this.querySelectorAll('.upselling-option');

    if (!options) return;

    options.forEach((opt) => {
      opt.addEventListener('click', (e) => {
        options.forEach((opt) => opt.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
      });
    });
  }

}

customElements.define('product-upsell-options', ProductUpsellOptions);
