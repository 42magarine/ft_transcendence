import { SliderProps } from '../../interfaces/componentInterfaces.js';

export default class Slider {
    async renderSlider({
        id,
        label,
        min,
        max,
        step = 1,
        value = min,
        onInput = '',
        className = ''
    }: SliderProps): Promise<string> {
        return `
			<div class="slider-container ${className}">
				<label for="${id}" class="block text-white mb-1">${label}</label>
				<input type="range" id="${id}" name="${id}"
					min="${min}" max="${max}" step="${step}" value="${value}"
					oninput="${onInput}"
					class="w-full">
			</div>
		`;
    }
}
