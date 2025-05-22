import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Title from '../components/Title.js';
import lobbyService from '../services/LobbyService.js';
import { LobbyInfo } from '../../interfaces/interfaces.js';
import Button from '../components/Button.js';
import { randomInt } from 'crypto';

export default class Lobby extends AbstractView {
    private lobbyData: LobbyInfo[] = [];
    private invitedLobby: LobbyInfo | null = null;

    constructor(params: URLSearchParams) {
        super();
        this.params = params;
    }

    async getHtml(): Promise<string> {
        const title = new Title({ title: 'Available Lobbies' });
        const titleSection = await title.getHtml();

        const button = new Button();
        const createLobbyButton = await button.renderButton({
            id: 'createLobbyBtn',
            text: 'Create Lobby',
            type: 'submit',
            className: 'btn btn-primary'
        });

        let lobbies = await lobbyService.getLobbyList()
        console.warn(lobbies)
        const card = new Card();
        const lobbyCard = await card.renderCard({
            title: 'Lobby List',
            extra: `${createLobbyButton}
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
									<td>Invited Lobby {{lobby.name}}</td>
									<td>{{lobby.id}}</td>
									<td>{{lobby.creatorId}}</td>
									<td>{{lobby.currentPlayers}} / {{lobby.maxPlayers}}</td>
									<td>{{lobby.isStarted ? 'Started' : 'Waiting'}</td>
									<td class="text-right">
				                        <a class="btn btn-accent accept-invite-btn" data-lobby="{{lobby.id}}" data-user="{{lobby.creatorId}}" href="/lobby/{{lobby.id}}">Accept Invite</a>
				                        <a router class="btn btn-primary" href="/lobby/{{lobby.id}}">Join Lobby</a>
									</td>
								</tr>
							</for>
						</tbody>
					</table>`,
            data: { lobbies }
        });

        // Register callback to listen for lobby updates via WebSocket or polling
        lobbyService.registerLobbyListListener(() => {
            this.lobbyData = lobbyService.getLobbyList();
        });

        return this.render(`
			<div class="container">
			${lobbyCard}
			</div>`
        );
    }
}
