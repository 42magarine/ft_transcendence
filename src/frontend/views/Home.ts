import UserService from '../services/UserService.js';
import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import __ from '../services/LanguageService.js';

export default class Home extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const currentUser = await UserService.getCurrentUser();
        const homeCard = await new Card().renderCard({
            title: currentUser
                ? `Hello ${currentUser.username}, ${window.ls.__('this is Transcendence!')}`
                : window.ls.__('Welcome to Transcendence!'),
        });
        return this.render(`${homeCard}`);
    }
}
