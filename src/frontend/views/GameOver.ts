import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Router from '../../utils/Router.js';
import __ from '../services/LanguageService.js';

export default class GameOver extends AbstractView {


    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);


        this.setTitle(`Waiting for the next round to start`);
    }

    async getHtml(): Promise<string> {
        const gameWinMessage: string = window.pongService.getGameWinMessage();
        const gameScoreMessage: string = window.pongService.getGameScoreMessage();

        const profileCard = await new Card().renderCard({
            contentBlocks: [
                {
                    type: 'heading',
                    props: {
                        text: `${gameWinMessage}`,
                        level: 2,
                        className: 'text-2xl font-bold text-center mb-4'
                    }
                },
                {
                    type: 'heading',
                    props: {
                        text: `${gameScoreMessage}`,
                        level: 2,
                        className: 'text-2xl font-bold text-center mb-4'
                    }
                },
            ],
            position: 'center'
        });

        return this.render(profileCard);
    }
}

