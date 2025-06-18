import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Router from '../../utils/Router.js';
import __ from '../services/LanguageService.js';

export default class TournamentTransition extends AbstractView {


    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);


        this.setTitle(`Waiting for the next round to start`);
    }

    async getHtml(): Promise<string> {

        const matchWinMessage: string = window.tournamentService.getMatchWinMessage();
        const matchScoreMessage: string = window.tournamentService.getMatchScoreMessage();

        const profileCard = await new Card().renderCard({
            contentBlocks: [
                {
                    type: 'heading',
                    props: {
                        text: `${matchWinMessage}`,
                        level: 2,
                        className: 'text-2xl font-bold text-center mb-4'
                    }
                },
                {
                    type: 'heading',
                    props: {
                        text: `${matchScoreMessage}`,
                        level: 2,
                        className: 'text-2xl font-bold text-center mb-4'
                    }
                },
                {
                    type: 'separator',
                },
                {
                    type: 'heading',
                    props: {
                        text: `Waiting for the next round to start`,
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

