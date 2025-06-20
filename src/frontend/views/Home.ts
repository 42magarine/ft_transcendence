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
                ? `👋 ${currentUser.username}, ${window.ls.__('this is Transcendence!')}`
                : window.ls.__('Welcome to Transcendence!'),
            contentBlocks: [
                {
                    type: 'paragraph',
                    props: {
                        html: window.ls.__('Your central hub for games, friendships, and tournaments.')
                    }
                }
            ]
        });

        const explanationCard = await new Card().renderCard({
            title: window.ls.__('How Transcendence Works'),
            contentBlocks: [
                {
                    type: 'paragraph',
                    props: {
                        html: window.ls.__('Transcendence is a multiplayer gaming platform built with modern technologies and a modular design.')
                    }
                },
                {
                    type: 'paragraph',
                    props: {
                        html: `
                            <ul class="list-disc pl-6 space-y-1">
                                <li>${window.ls.__('🎮 Play games like Pong or join tournaments.')}</li>
                                <li>${window.ls.__('🧑‍🤝‍🧑 Add friends and challenge them.')}</li>
                                <li>${window.ls.__('🗂️ Track your progress and achievements.')}</li>
                                <li>${window.ls.__('🌐 Customize your profile and settings.')}</li>
                                <li>${window.ls.__('🔒 Secure login with 2FA and account recovery.')}</li>
                            </ul>
                        `
                    }
                },
                {
                    type: 'paragraph',
                    props: {
                        html: window.ls.__('More features coming soon – stay tuned!')
                    }
                }
            ]
        });

        return this.render(`${homeCard}${explanationCard}`);
    }
}
