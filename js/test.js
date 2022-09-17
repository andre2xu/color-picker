import './helpers.js';
import ColorPicker from './color-picker.js';

window.addEventListener('load', function() {
    const WIDTH = Math.round(window.innerWidth * 0.12);
    const HEIGHT = WIDTH - 50;
    const COLOR_PICKER = new ColorPicker(document.getElementsByTagName('body')[0], WIDTH, HEIGHT);

    COLOR_PICKER.show();
});