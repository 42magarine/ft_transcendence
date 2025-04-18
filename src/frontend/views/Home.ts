// ========================
// File: views/Home.ts
// ========================

import AbstractView from '../../utils/AbstractView.js';
import { setBackgroundImage } from '../components/BackgroundManager.js';
import Farts from '../../utils/Farts.js';

export default class Home extends AbstractView {
	private fartsInstance: Farts;

	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
		this.setTitle('Transcendence - Home');

		// Initialize the Farts instance
		this.fartsInstance = new Farts({
			defaultSound: 'plop', // Different sound than header
			volume: 75
		});
	}

	/**
	 * Setup event listeners after the component is mounted
	 * Returns a Promise to match the AbstractView interface
	 */
	async afterRender(): Promise<void> {
		// Get the section element we want to add the click event to
		const sectionElement = document.querySelector('*');
		if (sectionElement) {
			sectionElement.addEventListener('click', (e) => {
				console.log("click")
				console.log("playRandomFart")
				this.playRandomFart();
			});
		}
	}

	/**
	 * Play a random fart sound
	 */
	playRandomFart(): void {
		console.log("play")
		// Array of available fart sounds
		const fartSounds = [
			'toot', 'ripper', 'plop', 'squit', 'raspberry',
			'squat', 'tuppence', 'liftoff', 'trumpet', 'fizzler',
			'windy', 'eine', 'fartception', 'fartpoint1'
		];

		// Choose a random sound
		const randomSound = fartSounds[Math.floor(Math.random() * fartSounds.length)];

		console.log(randomSound)
		// Play the sound
		console.log("play")
		this.fartsInstance.play(randomSound);
	}

	async getHtml(): Promise<string> {
		setBackgroundImage('/assets/backgrounds/home.png');
		document.getElementById('header-root')!.className = 'shadow-lg p-8 bg-gradient-to-r from-indigo-900/80 via-blue-900/80 to-sky-900/80 text-white backdrop-blur-md';
		document.getElementById('footer-root')!.className = 'py-4 px-6 w-full bg-gradient-to-r from-indigo-900/80 via-blue-900/80 to-sky-900/80 text-white backdrop-blur-md';

		// Add an ID to the section for easier access
		const html = this.render(`
            <section id="fartable-section" class="cursor-pointer">
                <div class="ml-auto flex gap-2 z-10">
                    <a router href="/pong" class="btn btn-secondary btn-theme-pong">Pong</a>
                    <a router href="/tictactoe" class="btn btn-secondary btn-theme-tictactoe">TicTacToe</a>
                </div>
            </section>
        `, {});

		return html;
	}
}