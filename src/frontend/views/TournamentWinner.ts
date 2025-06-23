import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';

export default class TournamentWinner extends AbstractView {
    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
        this.setTitle(`Waiting for the next round to start`);
    }

    async getHtml(): Promise<string> {

        const tournamentWinnerMsg: string = window.tournamentService.getTournamentWinnerMessage();
        const profileCard = await new Card().renderCard({
            contentBlocks: [
                {
                    type: 'heading',
                    props: {
                        text: `Winner of the tournament: ${tournamentWinnerMsg}`,
                        level: 1,
                        className: 'text-2xl font-bold text-center mb-4'
                    }
                },
            ]
        });

        return this.render(profileCard);
    }
}
