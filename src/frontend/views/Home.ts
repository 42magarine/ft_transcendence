import UserService from '../services/UserService.js';
import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';

export default class Home extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const currentUser = await UserService.getCurrentUser();

        const homeCard = await new Card().renderCard({
            title: currentUser
                ? `👋 ${currentUser.username}, ${window.ls.__('this is Transcendence!')}`
                : window.ls.__('Welcome to Transcendence!'),
            contentBlocks: [
                {
                    type: 'paragraph',
                    props: {
                        html: window.ls.__('Your central hub for games, friendships, and tournaments.')
                    }
                },
                {
                    type: 'html',
                    props: {
                        html: `
                            <ul class="list-none pl-4 space-y-3 text-base">
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-table-tennis-paddle-ball text-blue-500"></i>
                                    <span>${window.ls.__('Play games like Pong or join live tournaments.')}</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-user-friends text-green-500"></i>
                                    <span>${window.ls.__('Add friends and challenge them to matches.')}</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-chart-line text-purple-500"></i>
                                    <span>${window.ls.__('Track your progress and unlock achievements.')}</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-user-cog text-yellow-500"></i>
                                    <span>${window.ls.__('Customize your profile, themes, and settings.')}</span>
                                </li>
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-shield-alt text-red-500"></i>
                                    <span>${window.ls.__('Enjoy secure login with 2FA and account recovery.')}</span>
                                </li>
                            </ul>
                        `
                    }
                },
                {
                    type: 'paragraph',
                    props: {
                        html: window.ls.__('More features coming soon – stay tuned!')
                    }
                },
                {
                    type: 'paragraph',
                    props: {
                        html: window.ls.__('Mott du geile Schnitte')
                    }
                }
            ]
        });

        return this.render(`${homeCard}`);
    }
}
