import { UserModel } from "./User.Model.js";
export declare class TournamentModel {
    utid: number;
    tournamendAdminId?: number;
    participants: UserModel[];
    minPlayers: number;
    maxPlayers: number;
    rounds: TournamentRoundModel[];
    status: 'pending' | 'cancelled' | 'completed' | 'ongoing' | 'paused';
    createdAt: Date;
    startedAt?: Date;
    endedAt?: Date;
}
export declare class TournamentRoundModel {
    urid: number;
    roundNumber: number;
    tournament: TournamentModel;
    matches: TournamentMatchModel[];
}
export declare class TournamentMatchModel {
    umid: number;
    round: TournamentModel;
    player1: UserModel;
    player2: UserModel;
    winnerId: number;
    winner: UserModel;
    status: 'pending' | 'cancelled' | 'completed' | 'ongoing' | 'paused';
    startedAt?: Date;
    endedAt?: Date;
    player1Score?: number;
    player2Score?: number;
}
