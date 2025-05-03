import { ServerMessage, ClientMessage } from "../../types/ft_types.js";
import { PongGame } from "../models/Pong.js";
import { Player } from "../models/Player.js";
import { IPaddleDirection } from "../../types/interfaces.js";


export class MessageHandlers {
    private _broadcast: (lobbyId: string, data:ServerMessage) => void;

    constructor(broadcast: (lobbyId: string, data:ServerMessage) => void)
    {this._broadcast = broadcast;};

    public handleGameAction(player: Player, data: ClientMessage) {
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
