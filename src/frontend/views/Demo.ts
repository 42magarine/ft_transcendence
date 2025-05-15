// ========================
// File: views/Home.ts
// ========================
import AbstractView from '../../utils/AbstractView.js';
import Button from '../components/Button.js';
import Card from '../components/Card.js';
import Input from '../components/Input.js';
import Label from '../components/Label.js';
import Stat from '../components/Stat.js';
import Toggle from '../components/Toggle.js';

export default class Home extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {

        const button = new Button();
        const input = new Input();
        const label = new Label();
        const stat = new Stat();
        const toggle = new Toggle();
        const card = new Card();

        const groupHtml = await button.renderGroup({
            align: 'center',
            layout: 'group',
            buttons: [
                { id: 'g1', text: 'Play' },
                { id: 'g2', text: 'Learn' },
                { id: 'g3', text: 'Settings' }
            ]
        });

        const stackHtml = await button.renderGroup({
            layout: 'stack',
            align: 'center',
            buttons: [
                { id: 's1', text: 'Login' },
                { id: 's2', text: 'Register' }
            ]
        });

        const gridHtml = await button.renderGroup({
            layout: 'grid',
            columns: 3,
            align: 'center',
            buttons: [
                { id: 'g1', text: '1' },
                { id: 'g2', text: '2' },
                { id: 'g3', text: '3' },
                { id: 'g4', text: '4' },
                { id: 'g5', text: '5' },
                { id: 'g6', text: '6' }
            ]
        });

        const inputHtml = await input.renderInput({ id: 'email', name: 'email', placeholder: 'Enter your email' });
        const labelHtml = await label.renderLabel({ htmlFor: 'email', text: 'Email Address' });

        const statHtml = await stat.renderStat({ label: 'Users', value: '42' });
        const toggleHtml = await toggle.renderToggle({ id: 'darkMode', label: 'Dark Mode' });

        const demoCard = await card.renderCard({
            title: 'Demo Card',
            body: '<p class="text-white">This is a demo card body.</p>'
        });

        return this.render(`
			<section class="flex flex-col gap-10 w-full items-center justify-center px-6 py-12">
				<h2 class="text-white text-xl font-bold">Button Group (Row)</h2>
				${groupHtml}

				<h2 class="text-white text-xl font-bold">Stacked Buttons</h2>
				${stackHtml}

				<h2 class="text-white text-xl font-bold">Grid of Buttons (3 cols)</h2>
				${gridHtml}

				<h2 class="text-white text-xl font-bold">Input Field + Label</h2>
				<div class="w-full max-w-sm">${labelHtml}${inputHtml}</div>

				<h2 class="text-white text-xl font-bold">Stat Component</h2>
				${statHtml}

				<h2 class="text-white text-xl font-bold">Toggle Switch</h2>
				${toggleHtml}

				<h2 class="text-white text-xl font-bold">Card</h2>
				${demoCard}
				<button class="bg-blue-900 text-white px-4 py-2">Test</button>
			</section>
		`);
    }
}
