import UserService from '../services/UserService.js';
import AbstractView from '../../utils/AbstractView.js';
import Title from '../components/Title.js';

export default class Home extends AbstractView
{
	constructor()
    {
		super();
	}

	async getHtml(): Promise<string>
    {
		const currentUser = await UserService.getCurrentUser();
		const welcome = currentUser
			? `Hello ${currentUser.displayname}, this is Transcendence!`
			: 'Welcome to Transcendence!';

		const title = new Title(
            {
                title: welcome
            }
        );

		return this.render(`${await title.getHtml()}`);
	}
}
