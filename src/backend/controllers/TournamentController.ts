import { ClientMessage } from "../../types/interfaces.js";
import { WebSocket } from "ws";
import { Player } from "../gamelogic/components/Player.js";
import { TournamentLobby } from "../lobbies/TournamentLobby.js";
import { GameService } from "../services/GameService.js";
import { MessageHandlers } from "../services/MessageHandlers.js";
import { TournamentService } from "../services/TournamentService.js";
import { UserService } from "../services/UserService.js";
import { MatchController } from "./MatchController.js";

export class TournamentController extends MatchController {
    private _tournamentService: TournamentService;
    private _gameService: GameService;

    constructor() {
        const userService = new UserService();
        const gameService = new GameService(userService);
        const tournamentService = new TournamentService(userService);
        const lobbies = new Map<string, TournamentLobby>();

        super(userService, lobbies);

        this._tournamentService = tournamentService;
        this._gameService = gameService;
    }

    protected handleSpecificMessage(data: ClientMessage, connection: WebSocket, player: Player): void {
        switch (data.type) {
            case "startTournament":
                this.handleStartTournament(connection, player);
                break;

            case "getTournamentInfo":
                this.handleGetTournamentInfo(connection, player);
                break;

            case "getTournamentList":
                this.handleGetTournamentList(connection);
                break;
        }
    }

    protected createLobby(lobbyid:string) : TournamentLobby {
        return new TournamentLobby(
            lobbyid,
            this.broadcast.bind(this),
            this._tournamentService,
            this._gameService,
        )
    }

    private handleStartTournament(connection: WebSocket, player: Player) {
        if (!player || !player.lobbyId) {
            this.sendMessage(connection, {
                type: "error",
                message: "Not in a lobby"
            });
            return;
        }

        const lobby = this._lobbies.get(player.lobbyId) as TournamentLobby;
        if (!lobby) {
            this.sendMessage(connection, {
                type: "error",
                message: "Lobby not found"
            });
            return;
        }

        if (lobby.getCreatorId() !== player.userId) {
            this.sendMessage(connection, {
                type: "error",
                message: "Only creator can start tournament"
            });
            return;
        }

        if (lobby.getPlayerCount() < 2) {
            this.sendMessage(connection, {
                type: "error",
                message: "Need at least 2 players for tournament"
            });
            return;
        }

        if (!lobby.checkAllPlayersReady()) {
            this.sendMessage(connection, {
                type: "error",
                message: "All players must be ready"
            });
            return;
        }

        lobby.startGame();
    }

    private handleGetTournamentInfo(connection: WebSocket, player: Player) {
        if(!player || !player.lobbyId){
            this.sendMessage(connection, {
                type: "error",
                message: "not in tournament lob"})
            return
        }
        // Beispiel von handlegetLobbyinfo nehmen
    }


    private handleGetTournamentList(connection: WebSocket){
        //Beispiel von handlegetLobbyList nehmen
    }
}
