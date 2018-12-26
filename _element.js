import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';

/**
 * `mint-chart`
 * Mint Chart Visualization
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class MintChart extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <h2>Hello [[prop1]]!</h2>
    `;
  }
  static get properties() {
    return {
      prop1: {
        type: String,
        value: 'mint-chart',
      },
    };
  }
}

window.customElements.define('mint-chart', MintChart);
