import UserService from '../services/UserService.js';
import AbstractView from '../../utils/AbstractView.js';

export default class Home extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const currentUser = await UserService.getCurrentUser();
        const welcome = currentUser ? "Hello " + currentUser.id + currentUser.displayname + ", this is Transcendence!" : "Welcome to Trancendence!";
        return this.render(`
			<section>
				<h1>${welcome}</h1>
			</section>
		`);
    }
}
