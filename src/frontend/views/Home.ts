import ThemedView from '../theme/themedView.js';
import Auth from '../services/auth.js';

export default class Home extends ThemedView {
	constructor() {
		super('stars', 'Transcendence - Home');
	}

	async renderView(): Promise<string> {
		const auth = Auth.getInstance();
		const currentUser = auth.getCurrentUser();
		const welcome = currentUser ? "Hello " + currentUser.displayname + ", this is Transcendence!" : "Welcome to Trancendence!";
		return this.render(`
			<section>
				<h1>${welcome}</h1>
			</section>
		`);
	}
}