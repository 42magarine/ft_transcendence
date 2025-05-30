import { randomUUID } from "crypto";
import { ClientMessage, createLobbyMessage, GameActionMessage, joinLobbyMessage, leaveLobbyMessage, ReadyMessage, ServerMessage } from "../../interfaces/interfaces.js";
import { Player } from "../gamelogic/components/Player.js";
import { MessageHandlers } from "../services/MessageHandlers.js";
import { UserService } from "../services/UserService.js";
import { WebSocket } from "ws";
import { MatchLobby } from "../lobbies/MatchLobby.js";
import { MatchService } from "../services/MatchService.js";
import { MatchController } from "./MatchController.js";

export class TournamentController extends MatchController
{
    
}