export declare class GameModel {
    id: number;
    Player1: any;
    Player2: any;
    Player1Score: number;
    Player2Score: number;
    WinnerId?: number;
    CreatedAt: Date;
    EndedAt?: Date;
    status: 'pending' | 'cancelled' | 'completed' | 'ongoing' | 'paused';
    isLobbyOpen: boolean;
    lobbyParticipants: any[];
    gameAdminId?: number;
}
import "./User.Model.js";
