import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import __ from '../services/LanguageService.js';

export default class TournamentList extends AbstractView {
    constructor() {
        super();
        this.initEvents = this.setupEvents.bind(this);
        this.destroyEvents = this.cleanupEvents.bind(this);
    }

    async getHtml(): Promise<string> {
        const tournamentListCard = await new Card().renderCard({
            title: window.ls.__('Available Tournaments'),
            contentBlocks: [
                {
                    type: 'button',
                    props: {
                        id: 'createTournamentBtn',
                        text: window.ls.__('Create Tournament'),
                        type: 'button',
                        className: 'btn btn-primary'
                    }
                }
            ]
        });
        return this.render(`${tournamentListCard}`);
    }

    private setupEvents(): void {
        console.log('[TournamentList] setupEvents()');
        //window.tournamentListService?.setupEventListener();
    }

    private cleanupEvents(): void {
        console.log('[TournamentList] cleanupEvents()');
        // if (window.tournamentListService) {
        //     const createTournamentBtn = document.getElementById('createTournamentBtn');
        //     if (createTournamentBtn) {
        //         createTournamentBtn.removeEventListener(
        //             'click',
        //             window.tournamentListService.handleCreateTournamentClick
        //         );
        //     }
        // }
    }
}
