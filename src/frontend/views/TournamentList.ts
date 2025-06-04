import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';

export default class TournamentList extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const tournamentListCard = await new Card().renderCard({
            title: 'Available Tournaments',
            contentBlocks: [
                {
                    type: 'button',
                    props: {
                        id: 'createTournamentBtn',
                        text: 'Create Tournament',
                        type: 'button',
                        className: 'btn btn-primary'
                    },
                },
            ]
        });
        return this.render(`${tournamentListCard}`);
    }
}
