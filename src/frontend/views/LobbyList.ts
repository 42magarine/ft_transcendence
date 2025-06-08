import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import { ILobbyState } from '../../interfaces/interfaces.js';
import __ from '../services/LanguageService.js';

export default class LobbyList extends AbstractView {
	constructor() {
		super();

		this.initEvents = this.setupEvents.bind(this);
		this.destroyEvents = this.cleanupEvents.bind(this);
	}

	async getHtml(): Promise<string> {
		let lobbies: ILobbyState[] = [];
		lobbies = await window.lobbyListService.getLobbies();

		lobbies = lobbies.filter(
			(lobby) => lobby.currentPlayers !== lobby.maxPlayers && !lobby.isStarted
		);

		const lobbyListCard = await new Card().renderCard({
			title: __('Available Lobbies'),
			contentBlocks: [
				{
					type: 'button',
					props: {
						id: 'createLobbyBtn',
						text: __('Create Lobby'),
						type: 'button',
						className: 'btn btn-primary'
					}
				},
				{
					type: 'table',
					props: {
						id: 'lobby-list',
						title: __('Lobby List'),
						height: '400px',
						data: lobbies,
						columns: [
							{ key: 'id', label: __('ID') },
							{ key: 'creatorId', label: __('Creator') },
							{ key: 'players', label: __('Players') },
							{ key: 'status', label: __('Status') },
							{ key: 'actions', label: __('Actions') }
						],
						rowLayout: (lobby) => [
							{
								type: 'label',
								props: {
									htmlFor: '',
									text: `${lobby.lobbyId}`
								}
							},
							{
								type: 'label',
								props: {
									htmlFor: '',
									text: `${lobby.creatorId}`
								}
							},
							{
								type: 'stat',
								props: {
									label: '',
									value: `${lobby.currentPlayers} / ${lobby.maxPlayers}`
								}
							},
							{
								type: 'stat',
								props: {
									label: '',
									value: lobby.isStarted ? __('Started') : __('Waiting')
								}
							},
							{
								type: 'button',
								props: {
									text: __('Join Lobby'),
									className:
										'joinLobbyBtn btn btn-primary ' +
										(lobby.currentPlayers == lobby.maxPlayers ? 'disabled' : ''),
									dataAttributes: {
										'lobby-id': lobby.lobbyId
									}
								}
							}
						]
					}
				}
			]
		});

		return this.render(`${lobbyListCard}`);
	}

	private setupEvents(): void {
		console.log('[LobbyList] setupEvents()');

		window.lobbyListService?.setupCreateLobbyButtonListener();
		window.lobbyListService?.setupJoinLobbyButtonListener();
	}

	private cleanupEvents(): void {
		console.log('[LobbyList] cleanupEvents()');

		if (window.lobbyListService) {
			const createButton = document.getElementById('createLobbyBtn');
			if (createButton) {
				createButton.removeEventListener(
					'click',
					window.lobbyListService.handleCreateLobbyClick
				);
			}

			const joinButtons = document.querySelectorAll('.joinLobbyBtn');
			joinButtons.forEach((btn: Element) => {
				btn.removeEventListener(
					'click',
					window.lobbyListService.handleJoinLobbyClick
				);
			});
		}
	}
}
