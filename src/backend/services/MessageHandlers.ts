import { ServerMessage, ClientMessage, GameActionMessage } from "../../interfaces/interfaces.js";
import { Player } from "../gamelogic/components/Player.js";

export class MessageHandlers {
    private _broadcast: (lobbyId: string, data: ServerMessage) => void;

    constructor(broadcast: (lobbyId: string, data: ServerMessage) => void) { this._broadcast = broadcast; };

    public handleGameAction(player: Player, data: GameActionMessage) {
        if (!player.lobbyId) {
            return;
        }

        if (data.action) {
            switch (data.action) {
                case "movePaddle":
                    if (data.direction) {
                        this._broadcast(player.lobbyId, {
                            type: "paddleMove",
                            playerNumber: player.id,
                            direction: data.direction
                        })
                    }
                    break;
                case "ready":
                    player._isReady = data.ready;
                    this._broadcast(player.lobbyId, {
                        type: "playerReady",
                        playerNumber: player.id,
                        ready: player._isReady
                    })
                    break;
                case "pauseGame":
                    this._broadcast(player.lobbyId, {
                        type: "gamePaused",
                        playerNumber: player.id,
                    });
                    break;
                case "resumeGame":
                    if (player?.lobbyId) {
                        this._broadcast(player.lobbyId, {
                            type: "gameResumed",
                            playerNumber: player.id,
                        });
                    }
                    break;
                default:
                    console.warn(`Unhandled message type: ${data.type}`);
                    break;
            }
        }
    }
}
