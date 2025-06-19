import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import __ from '../services/LanguageService.js';

export default class TournamentWaitingRoom extends AbstractView {
    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
        this.setTitle(`Waiting for the next round to start`);
    }

    async getHtml(): Promise<string> {
        // const msg = await window.TournamentWaitingRoomService.getMessage;

        const profileCard = await new Card().renderCard({
            contentBlocks: [
                {
                    type: 'heading',
                    props: {
                        text: `Waiting for the next round to start`,
                        level: 1,
                        className: 'text-2xl font-bold text-center mb-4'
                    }
                },
            ]
        });

        return this.render(profileCard);
    }
}
