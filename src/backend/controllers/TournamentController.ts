import { Player } from "../gamelogic/components/Player.js";
import { TournamentLobby } from "../lobbies/TournamentLobby.js";
import { GameService } from "../services/GameService.js";
import { MessageHandlers } from "../services/MessageHandlers.js";
import { TournamentService } from "../services/TournamentService.js";
import { UserService } from "../services/UserService.js";
import { MatchController } from "./MatchController.js";

export class TournamentController extends MatchController{
    private _lobbies: Map<string, TournamentLobby>;
    private _clients: Map<WebSocket, Player | null>;
    private _handlers: MessageHandlers;
    private _tournamentService: TournamentService;

    constructor() {
        const coolUserService = new UserService()
        super(coolUserService, )
        this._tournamentService = new TournamentService(coolUserService, new GameService(coolUserService));
        this._lobbies = new Map<string, TournamentLobby>();
        this._clients = new Map<WebSocket, Player | null>;
        this._handlers = new MessageHandlers(this._broadcast.bind(this));
    }

    public handleConnection = (connection: WebSocket, userId?:number): void => {
        console.log("new client connection")
        this._clients.set(connection, null);

    }


}