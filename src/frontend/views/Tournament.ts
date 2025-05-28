import AbstractView from '../../utils/AbstractView.js';
import Title from '../components/Title.js';
import Button from '../components/Button.js';

export default class Tournament extends AbstractView
{
    constructor(params: URLSearchParams)
	{
        super();
        this.params = params;
    }

    async getHtml(): Promise<string>
	{
        const title = new Title(
		{
			title: 'Tournament Bracket'
		}
		);
        const titleSection = await title.getHtml();

        const button = new Button();
        const backButton = await button.renderButton(
		{
            id: 'returnLobbyBtn',
            text: 'Return to Lobby',
            className: 'btn btn-secondary',
            href: '/lobby',
        });

        return this.render(`
			<div class="container">
				${titleSection}
				${backButton}
				<div class="tournament-bracket">
					<div class="round round-1">
						<div class="match"><span>Player A</span><span>Player B</span></div>
						<div class="match"><span>Player C</span><span>Player D</span></div>
						<div class="match"><span>Player E</span><span>Player F</span></div>
						<div class="match"><span>Player G</span><span>Player H</span></div>
					</div>
					<div class="round round-2">
						<div class="match"><span>Winner 1</span><span>Winner 2</span></div>
						<div class="match"><span>Winner 3</span><span>Winner 4</span></div>
					</div>
					<div class="round final">
						<div class="match"><span>Finalist 1</span><span>Finalist 2</span></div>
					</div>
				</div>
			</div>
		`);
    }
}
