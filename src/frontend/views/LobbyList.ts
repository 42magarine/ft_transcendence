import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Title from '../components/Title.js';
import LobbyService from '../services/LobbyService.js';
import { LobbyInfo } from '../../types/interfaces.js';
import Button from '../components/Button.js';

export default class Lobby extends AbstractView {
    private lobbyService: LobbyService;
    private lobbyData: LobbyInfo[] = [];

    constructor(params: URLSearchParams) {
        super();
        this.params = params;
        this.lobbyService = new LobbyService();
    }

    async getHtml(): Promise<string> {
        const title = new Title({ title: 'Available Lobbies' });
        const titleSection = await title.getHtml();

        const button = new Button();
        const createLobbyButton = await button.renderButton({
            id: 'createLobbyBtn',
            text: 'Create Lobby',
            className: 'btn btn-primary'
        });

        // Placeholder card
        const card = new Card();
        const placeholderCard = await card.renderCard({
            title: 'Lobby List',
            extra: `<div>Loading lobbies...</div>`,
        });

        // Register listener after rendering
        setTimeout(() => {
            this.lobbyService.registerLobbyListListener(() => {
                this.lobbyData = this.lobbyService.getLobbyList();
                this.updateLobbyList();
            });
            this.lobbyService.safeSend({ type: 'getLobbyList' });
        }, 0);

        return this.render(`
            <div class="container">
                ${titleSection}
                ${createLobbyButton}
                <div class="card-container">
                    ${placeholderCard}
                </div>
            </div>
        `);
    }

    private async updateLobbyList() {
        const container = document.querySelector('.card-container');
        if (!container) return;

        const card = new Card();
        const updatedCardHtml = await card.renderCard({
            title: 'Lobby List',
            extra: this.buildLobbyTable(),
            data: { lobbies: this.lobbyData }
        });

        container.innerHTML = updatedCardHtml;
    }

    private buildLobbyTable(): string {
        return `
            <table class="list" data-height="400px">
                <thead>
                    <tr>
                        <th>Lobby Name</th>
                        <th>ID</th>
                        <th>Creator ID</th>
                        <th>Players</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <for each="lobbies" as="lobby">
                        <tr>
                            <td>{{lobby.name}}</td>
                            <td>{{lobby.id}}</td>
                            <td>{{lobby.creatorId}}</td>
                            <td>{{lobby.currentPlayers}} / {{lobby.maxPlayers}}</td>
                            <td>{{lobby.isStarted ? 'Started' : 'Waiting'}}</td>
                            <td class="text-right">
                                <a router class="btn btn-primary" href="/lobby/{{lobby.id}}">
                                    Join Lobby
                                </a>
                            </td>
                        </tr>
                    </for>
                </tbody>
            </table>
        `;
    }
}
