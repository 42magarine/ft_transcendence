import { IServerMessage, ILobbyState as ITournamentState } from '../../interfaces/interfaces.js';

export default class TournamentService {

    public setupEventListener(): void {
        // const button = document.getElementById('');
        // if (button) {
        //     button.addEventListener('click', this.);
        // }
    }

    public handleSocketMessage = (event: MessageEvent<string>): void => {
        const data: IServerMessage = JSON.parse(event.data);
    }
}
