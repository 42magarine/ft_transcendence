import { ServerMessage, ClientMessage, GameActionMessage } from "../../types/interfaces.js";
import { Player } from "../gamelogic/components/Player.js";


export class MessageHandlers {
    private _broadcast: (lobbyId: string, data:ServerMessage) => void;

    constructor(broadcast: (lobbyId: string, data:ServerMessage) => void)
    {this._broadcast = broadcast;};

    public handleGameAction(player: Player, data: GameActionMessage) {
        if (!player.lobbyId)
            return;

        if (data.action)
        {
            switch(data.action)
            {
                case "movePaddle":
                    if (data.direction) {
                        this._broadcast(player.lobbyId, {
                            type: "paddleMove",
                            playerId: player.id,
                            direction: data.direction
                        })
                    }
                    break;
                case "ready":
                    player._isReady = data.ready;
                    this._broadcast(player.lobbyId, {
                        type: "playerReady",
                        playerId: player.id,
                        ready: player._isReady
                    })
                    break;
                case "pauseGame":
                    this._broadcast(player.lobbyId, {
                        type: "gamePaused",
                        playerId: player.id
                    })
                    break;

                case "resumeGame":
                    this._broadcast(player.lobbyId, {
                        type: "gameResumed",
                        playerId: player.id
                    })
                    break;

                default:
                    console.warn("Unknown game action", data.action);
            }
        }
    }

}
