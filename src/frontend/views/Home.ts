import ThemedView from '../theme/themedView.js';
import { UserManagementService } from '../services/user_management.js';

export default class Home extends ThemedView {
	constructor() {
		super('stars', 'Transcendence - Home');
	}

	async renderView(): Promise<string> {
		const currentUser = await UserManagementService.getCurrentUser();
		const welcome = currentUser ? "Hello " + currentUser.id + currentUser.displayname + ", this is Transcendence!" : "Welcome to Trancendence!";
		return this.render(`
			<section>
				<h1>${welcome}</h1>
			</section>
		`);
	}
}