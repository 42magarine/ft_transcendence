import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import { LobbyInfo } from '../../interfaces/interfaces.js';

export default class LobbyList extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        let lobbies: LobbyInfo[] = [];
        lobbies = await window.lobbyListService.getLobbies();

        console.debug('[LobbyList] Fetched lobbies:', lobbies);

        if (!Array.isArray(lobbies) || lobbies.length === 0) {
            console.warn('[LobbyList] No lobbies found or invalid format.');
        }

        // console.log(lobbies);
        // lobbies.forEach((lobby, i) => {
        //     console.log(`[Lobby ${i}]`, {
        //         name: lobby.name,
        //         id: lobby.id,
        //         lobbyId: lobby.lobbyId,
        //         creatorId: lobby.creatorId,
        //         currentPlayers: lobby.currentPlayers,
        //         maxPlayers: lobby.maxPlayers,
        //         isStarted: lobby.isStarted,
        //     });
        // });

        const lobbyListCard = await new Card().renderCard({
            title: 'Available Lobbies',
            contentBlocks: [
                {
                    type: 'button',
                    props: {
                        id: 'createLobbyBtn',
                        text: 'Create Lobby',
                        type: 'button',
                        className: 'btn btn-primary'
                    },
                },
                {
                    type: 'table',
                    props: {
                        id: 'lobby-list',
                        height: '400px',
                        data: lobbies,
                        rowLayout: (lobby) => [
                            { type: 'label', props: { htmlFor: '', text: `${lobby.name}` } },
                            { type: 'label', props: { htmlFor: '', text: `${lobby.id}` } },
                            { type: 'label', props: { htmlFor: '', text: `${lobby.creatorId}` } },
                            { type: 'stat', props: { label: '', value: `${lobby.currentPlayers} / ${lobby.maxPlayers}` } },
                            { type: 'stat', props: { label: '', value: lobby.isStarted ? 'Started' : 'Waiting' } },
                            {
                                type: 'buttongroup',
                                props: {
                                    layout: 'group',
                                    buttons: [
                                        {
                                            id: 'joinLobbyBtn',
                                            text: 'Join Lobby',
                                            className: 'btn btn-primary',
                                            onClick: 'handleJoinLobbyClick(event)',
                                            dataAttributes:
                                            {
                                                'lobby-id': lobby.lobbyId  
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        });

        return this.render(`${lobbyListCard}`);
    }
}
