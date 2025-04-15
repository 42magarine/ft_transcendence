// ========================
// File: components/Toolbar.ts
// ========================
import AbstractView from '../../utils/AbstractView.js';
import Button from './Button.js';
export default class Toolbar extends AbstractView {
    constructor(params = new URLSearchParams()) {
        super(params);
    }
    async renderToolbar({ buttons, align = 'left' }) {
        const theme = this.props?.theme || 'default';
        const renderedButtons = await Promise.all(buttons.map(async (btnProps) => {
            const btn = new Button(new URLSearchParams({ theme }));
            return await btn.renderButton(btnProps);
        }));
        const justifyMap = {
            left: 'justify-start',
            center: 'justify-center',
            right: 'justify-end',
        };
        const justifyClass = justifyMap[align] || 'justify-start';
        return this.render(`
			<div class="toolbar flex flex-wrap gap-2 ${justifyClass}">
				${renderedButtons.join('\n')}
			</div>
		`);
    }
    async getHtml() {
        const theme = this.props?.theme || 'default';
        const btn = new Button(new URLSearchParams({ theme }));
        const defaultBtn = await btn.renderButton({ id: 'default-btn', text: 'Click me' });
        return this.render(`<div class="toolbar flex gap-2">${defaultBtn}</div>`);
    }
}
