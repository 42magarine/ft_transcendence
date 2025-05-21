import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Title from '../components/Title.js';
import gameService from '../services/GameService.js';
import { LobbyInfo } from '../../interfaces/interfaces.js';
import Button from '../components/Button.js';
import { randomInt } from 'crypto';

export default class Lobby extends AbstractView {
	private lobbyData: LobbyInfo[] = [];

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

		let lobbies = await gameService.lobbyList.getLobbies()
		const card = new Card();
		const lobbyListCard = await card.renderCard({
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
        gameService.lobbyList.onUpdate(() => {
            this.lobbyData = gameService.lobbyList.getLobbies();
        });

		return this.render(`
			<div class="container">
			${lobbyListCard}
			</div>`
		);
	}
}
