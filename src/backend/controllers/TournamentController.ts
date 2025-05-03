import { Player } from "../gamelogic/Player.js";
import { MessageHandlers } from "../services/MessageHandlers.js";

export class TournamentController {
    private _lobbies: Map<string, TournamentLobby>;
    private _clients: Map<WebSocket, Player | null>;
    private _handlers: TournamentMessageHandlers;
    private _tournamentService: TournamentService;

    constructor() {
        this._tournamentService = new TournamentService(new TournamentRepository(), new UserService());
        this._lobbies = new Map<string, TournamentLobby>();
        this._clients = new Map<WebSocket, Player | null>;
        this._handlers = new TournamentMessageHandlers(this.tournamentBroadcast.bind(this));
    }

    public handleConnection = (connection: WebSocket, userId?:number): void => {
        console.log("new client connection")
        this._clients.set(connection, null);

    }


}