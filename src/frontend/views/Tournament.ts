import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';

export default class Tournament extends AbstractView
{
    constructor(params: URLSearchParams)
	{
        super();
        this.params = params;
    }

    async getHtml(): Promise<string>
	{
		const tournamentCard = await new Card().renderCard(
		{
		});
	
        return this.render(`${tournamentCard}`);
    }
}
