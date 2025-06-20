import { SliderProps } from '../../interfaces/componentInterfaces.js';

export default class Slider {
    async renderSlider({ id, label, min, max, step = 1, value = min, onInput = '', className = '' }: SliderProps): Promise<string> {
        const valueDisplayId = `${id}-value`;
        const extendedOnInput = `
      ${onInput}
      document.getElementById('${valueDisplayId}').textContent = this.value;
    `.trim();

        return `
        <div class="slider-container ${className}">
          <div class="flex justify-between items-center mb-1">
            <label for="${id}" class="block text-white">${label}</label>
            <span id="${valueDisplayId}" class="text-white font-mono bg-gray-700 px-2 py-1 rounded text-sm">${value}</span>
        </div>
        <input type="range" id="${id}" name="${id}" min="${min}" max="${max}" step="${step}" value="${value}" oninput="${extendedOnInput}" class="w-full">
        </div>
        `;
    }
}
