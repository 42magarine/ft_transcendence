interface FartOptions {
	defaultSound?: string;
	loop?: boolean;
	volume?: number; // 0 - 100
}

interface FartSounds {
	[key: string]: string;
}

export default class Farts {
	private static preloaded: boolean = false;
	private sounds: FartSounds;
	private fartPlayer: HTMLAudioElement | HTMLObjectElement | null;
	private oldPlayer: boolean;
	private options: Required<FartOptions>;

	constructor(options?: FartOptions) {
		this.sounds = {
			toot: 'fart1',
			ripper: 'fart2',
			plop: 'fart3',
			squit: 'fart4',
			raspberry: 'fart5',
			squat: 'fart6',
			tuppence: 'fart7',
			liftoff: 'fart8',
			trumpet: 'fart9',
			fizzler: 'fart10',
			windy: 'fart11',
			eine: 'fart12',
			fartception: 'fart13',
			fartpoint1: 'fart14'
		};

		this.fartPlayer = null;
		this.oldPlayer = false;

		this.options = {
			defaultSound: this.sounds.raspberry,
			loop: false,
			volume: 50
		};

		if (options) {
			if (options.defaultSound !== undefined) this.options.defaultSound = options.defaultSound;
			if (options.loop !== undefined) this.options.loop = options.loop;
			if (options.volume !== undefined) this.options.volume = options.volume;
		}

		this.init();
	}

	private init(): void {
		this.fartPlayer = document.createElement("audio");
		if (typeof (this.fartPlayer as HTMLAudioElement).canPlayType === 'undefined') {
			this.loadOldPlayer();
		}
		this.preload();
	}

	private loadOldPlayer(): void {
		document.body.innerHTML += '<div style="display:none;"><object id="contentPlayer" classid="CLSID:6BF52A52-394A-11d3-B153-00C04F79FAA6" width="100" height="100"><param name="volume" value="100%" /><param name="windowlessVideo" value="true"><param name="AnimationatStart" value="0" /><param name="autostart" value="1" /></object></div>';
		this.fartPlayer = document.getElementById('contentPlayer') as HTMLObjectElement;
		this.oldPlayer = true;
	}

	public play(sound?: string, callback?: () => void): void {
		let fartSound: string;
		console.log("play")
		if (sound) {
			if (this.sounds[sound]) {
				fartSound = this.sounds[sound];
			} else {
				fartSound = sound;
			}
		} else {
			fartSound = this.options.defaultSound;
		}

		if (!this.oldPlayer && this.fartPlayer instanceof HTMLAudioElement) {
			const ext = (this.fartPlayer.canPlayType('audio/mp3')) ? '.mp3' : '.wav';
			this.fartPlayer.setAttribute('src', `/assets/farts/${fartSound}${ext}`);
			this.fartPlayer.loop = this.options.loop;
			this.fartPlayer.volume = (this.options.volume / 100);
			this.fartPlayer.play();

			if (callback) {
				const handleEnded = (): void => {
					if (callback) {
						callback();
						this.fartPlayer?.removeEventListener("ended", handleEnded);
					}
				};
				this.fartPlayer.addEventListener("ended", handleEnded);
			}
		} else if (this.fartPlayer instanceof HTMLObjectElement) {
			(this.fartPlayer as any).URL = `/assets/farts/${fartSound}.mp3`;
		}
	}

	public stop(): void {
		if (this.fartPlayer instanceof HTMLAudioElement) {
			this.fartPlayer.pause();
		}
	}

	public remove(): void {
		if (this.fartPlayer instanceof HTMLAudioElement) {
			this.fartPlayer.remove();
		}
	}

	public random(): void {
		const keys = Object.keys(this.sounds);
		const randomFart = keys[Math.floor(Math.random() * keys.length)];
		this.play(randomFart);
	}

	private preload(): void {
		if (!this.oldPlayer && !Farts.preloaded && this.fartPlayer instanceof HTMLAudioElement) {
			for (const fartName in this.sounds) {
				if (Object.prototype.hasOwnProperty.call(this.sounds, fartName)) {
					const ext = (this.fartPlayer.canPlayType('audio/mp3')) ? '.mp3' : '.wav';
					this.fartPlayer.setAttribute('src', `/assets/farts/${this.sounds[fartName]}${ext}`);
				}
			}
			Farts.preloaded = true;
		}
	}
}