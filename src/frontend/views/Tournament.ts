import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';

export default class Tournament extends AbstractView {
    constructor() {
        super();

        this.initEvents = this.setupEvents.bind(this);
        this.destroyEvents = this.cleanupEvents.bind(this);
    }

    async getHtml(): Promise<string> {
        const tournamentCard = await new Card().renderCard({

        });
        return this.render(`${tournamentCard}`);
    }

    private setupEvents(): void {
        console.log('[Tournament] setupEvents()');

        window.tournamentService?.setupEventListener();
    }

    private cleanupEvents(): void {
        console.log('[Tournament] cleanupEvents()');

        // if (window.tournamentService) {
        //     const Button = document.getElementById('');
        //     if (Button) {
        //         Button.removeEventListener('click', window.tournamentService.);
        //     }
        // }
    }
}
