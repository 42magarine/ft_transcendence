import { WebSocket } from "ws";
import { ClientMessage, ServerMessage } from "../../types/ft_types.js";
import { Player } from "../models/Player.js";
import { PongController } from "../controllers/PongController.js"; // adjust the import path as needed

export class MessageHandlers {
    private _broadcast: (lobbyId: string, data: ServerMessage) => void;
    private _controllerHandlers: PongController;

    constructor(
        broadcast: (lobbyId: string, data: ServerMessage) => void,
        controllerHandlers: PongController
    ) {
        this._broadcast = broadcast;
        this._controllerHandlers = controllerHandlers;
    }

    public handle(
        data: ClientMessage,
        connection: WebSocket,
        player?: Player | null
    ): void {
        switch (data.type) {
            case "createLobby":
                this._controllerHandlers.handleCreateLobby(connection, data.userId);
                break;

            case "joinLobby":
                this._controllerHandlers.handleJoinLobby(connection, data.userId, data.lobbyId);
                break;

            case "leaveLobby":
                this._controllerHandlers.handleLeaveLobby(connection);
                break;

            case "initGame":
                this._controllerHandlers.handleInitGame(connection);
                break;

            case "movePaddle":
                if (data.direction && player?.lobbyId) {
                    this._broadcast(player.lobbyId, {
                        type: "paddleMove",
                        playerId: player.id,
                        direction: data.direction,
                    });
                }
                break;

            case "pauseGame":
                if (player?.lobbyId) {
                    this._broadcast(player.lobbyId, {
                        type: "gamePaused",
                        playerId: player.id,
                    });
                }
                break;

            case "resumeGame":
                if (player?.lobbyId) {
                    this._broadcast(player.lobbyId, {
                        type: "gameResumed",
                        playerId: player.id,
                    });
                }
                break;

            default:
                console.warn(`Unhandled message type: ${data.type}`);
                break;
        }
    }
}
