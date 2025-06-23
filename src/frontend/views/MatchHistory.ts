// MatchHistory.ts
import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import UserService from '../services/UserService.js';
import { MatchRecord } from '../../interfaces/interfaces.js';

export default class MatchHistory extends AbstractView {
	constructor() {
		super();
	}

	async getHtml(): Promise<string> {
		const matches: MatchRecord[] = await UserService.getMatchHistory();

		const historyCard = await new Card().renderCard({
			title: window.ls.__('Match History'),
			contentBlocks: [
				{
					type: 'table',
					props: {
						id: 'match-history',
						title: window.ls.__('Your Past Matches'),
						height: '300px',
						data: matches,
						columns: [
							{ key: 'player1', label: window.ls.__('Player 1') },
							{ key: 'player2', label: window.ls.__('Player 2') },
							{ key: 'winner', label: window.ls.__('Winner') },
							{ key: 'createdAt', label: window.ls.__('Date') }
						],
						rowLayout: (match) => [
							{
								type: 'label',
								props: {
									text: match.player1.username,
									htmlFor: `match-${match.id}-p1`
								}
							},
							{
								type: 'label',
								props: {
									text: match.player2.username,
									htmlFor: `match-${match.id}-p2`
								}
							},
							{
								type: 'label',
								props: {
									text: match.winner ? match.winner.username : window.ls.__('Draw'),
									htmlFor: `match-${match.id}-winner`
								}
							},
                            {
                                type: 'label',
                                props: {
                                    text: (() => {
                                        const date = new Date(match.createdAt);
                                        const day = date.getDate();
                                        const month = date.getMonth() + 1;
                                        const year = String(date.getFullYear()).slice(2);
                                        const hour = String(date.getHours()).padStart(2, '0');
                                        const minute = String(date.getMinutes()).padStart(2, '0');
                                        return `${month}/${day}/${year} ` + hour + '-' + minute;
                                    })(),
                                    htmlFor: `match-${match.id}-created`
                                }
                            }                                                                                          
						]
					}
				}
			]
		});

		return this.render(`${historyCard}`);
	}
}
