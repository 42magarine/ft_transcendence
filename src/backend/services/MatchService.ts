import { AppDataSource } from "../DataSource.js";
import { MatchModel } from "../models/MatchModel.js";
import { UserService } from "./UserService.js";

export class MatchService {
    public matchRepo = AppDataSource.getRepository(MatchModel);
    public userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    async getMatchById(matchId: number) {
        return await this.matchRepo.findOne({
            where: { matchModelId: matchId },
            relations: ['player1', 'player2', 'winner', 'lobbyParticipants']
        })
    }

    async getMatchLobbyById(lobbyId: string) {
        return await this.matchRepo.findOne({
            where: { lobbyId },
            relations: ['player1', 'player2', 'winner', 'lobbyParticipants']
        })
    }

    //update score of match / do winner update in DB
    async updateScore(matchId: number, player1Score: number, player2Score: number, winnerId?: number) {
        const match = await this.getMatchById(matchId);

        if (!match) {
            throw new Error("match not found");
        }

        match.player1Score = player1Score;
        match.player2Score = player2Score;

        //set winner in DB
        if (winnerId) {
            const winner = await this.userService.findUserById(winnerId)
            if (!winner) {
                throw new Error("Couldn't find winner in users");
            }
            match.winner = winner;
            match.winnerId = winnerId;
            match.status = 'completed'
            match.endedAt = new Date();
        }

        return await this.matchRepo.save(match);
    }

    async deleteMatch(matchId: number) {
        const match = await this.getMatchById(matchId);
        if (!match) {
            throw new Error("couldnt do it");
        }
        return await this.matchRepo.remove(match);
    }

    async deleteMatchByLobbyId(lobbyId: string): Promise<boolean> {
        try {
            const result = await this.matchRepo.delete({ lobbyId });
            return result.affected ? result.affected > 0 : false;
        }
        catch (error) {
            console.error("Error deleting match:", error);
            return false;
        }
    }

    //table join search for finding a matchmodel by using the user/playerId (this should be the same btw!!!)
    async findMatchByPlayerId(playerId: number) {
        return await this.matchRepo.createQueryBuilder("match")
            .leftJoinAndSelect("match.player1", "player1")
            .leftJoinAndSelect("match.player2", "player2")
            .leftJoinAndSelect("match.winner", "winner")
            .where("player1.id = :id", { id: playerId })
            .orWhere("player2.id = :id", { id: playerId })
            .orderBy("match.id", "DESC")
            .getMany();
    }

    //Get UserName from userService using ID
    protected async getUsernameById(userId: number) {
        const user = await this.userService.findUserById(userId);
        return user?.username;
    }

    //check for Winner / Loser of current player in the Match!!
    protected getWinner(match: MatchModel, userId: number) {
        if (!match.winnerId) {
            return "In Progress";
        }
        return match.winnerId === userId ? "Won" : "Lost";
    }

    async createMatch(lobbyId: string, userId: number): Promise<MatchModel> {
        const player1 = await this.userService.findUserById(userId);
        if (player1 == null) {
            throw new Error("User does not exist in DB");
        }

        const match = new MatchModel();
        match.lobbyId = lobbyId;
        match.createdAt = new Date();
        match.player1 = player1;
        match.player2 = null;
        match.maxPlayers = 2;
        match.isLobbyOpen = true;
        match.status = "pending";
        match.invitedUserIds = [];
        match.lobbyParticipants = [];
        match.player1Score = 0;
        match.player2Score = 0;
        match.readyStatusMap = [];

        return await this.matchRepo.save(match);
    }

    async addPlayerToMatch(lobbyId: string, userId: number): Promise<MatchModel> {
        const match = await this.getMatchLobbyById(lobbyId);
        if (!match) {
            throw new Error("Match not found");
        }

        const player2 = await this.userService.findUserById(userId);
        if (!player2) {
            throw new Error("User does not exist in DB");
        }

        match.player2 = player2;
        // match.lobbyParticipants.push(player2);
        // match.status = "waiting_for_ready";

        return await this.matchRepo.save(match);
    }

    async removePlayerFromMatch(lobbyId: string, userId: number): Promise<boolean> {
        try {
            const match = await this.getMatchLobbyById(lobbyId);
            if (!match) {
                throw new Error("Match not found");
            }

            // Prüfen welcher Spieler entfernt werden soll
            if (match.player1?.id === userId) {
                // Wenn Player1 verlässt und Player2 existiert, Player2 zu Player1 machen
                if (match.player2) {
                    match.player1 = match.player2;
                    match.player2 = null;
                }
                else {
                    // Wenn nur Player1 da war, Match löschen
                    await this.matchRepo.delete({ lobbyId });
                    return true;
                }
            }
            else if (match.player2?.id === userId) {
                match.player2 = null;
            }
            else {
                throw new Error("Player not found in this match");
            }

            await this.matchRepo.save(match);
            return true;
        }
        catch (error) {
            console.error("Error removing player from match:", error);
            return false;
        }
    }

    //function that should return score values / playerInfo of specified Match!
    async getMatchStateById(matchId: number, userId: number) {
        const match = await this.getMatchById(matchId);
        if (!match) {
            throw new Error("match doesnt exist");
        }
        return this.getWinner(match, userId);
    }

    // add participant to lobby (usually player 2 for now)
    // according to gameId and userId get matchModel from DB, find user in DB.
    async addLobbyParticipant(matchId: number, userId: number) {
        try {
            const match = await this.getMatchById(matchId);
            const user = await this.userService.findUserById(userId);

            //if match / user doesnt exist in db throw error!
            if (!match || !user) {
                throw new Error("Couldn't find correct match/user");
            }

            // if null lobby in DB set to empty array!
            if (!match.lobbyParticipants) {
                match.lobbyParticipants = [];
            }

            //search for user in lobbyParticipants list of DataBase MatchModel
            //push into DB List if not existing!!
            const existingParticipant = match.lobbyParticipants.find(p => p.id === userId);
            if (!existingParticipant) {
                match.lobbyParticipants.push(user);
            }

            //if lobbyParticipants are equal to 2 and no player2Id and player1Id isnt player2Id
            // set user to player 2! save in DB
            if (match.lobbyParticipants.length === 2 && !match.player2?.id && match.player1?.id !== userId) {
                match.player2 = user;
            }
            return await this.matchRepo.save(match)
        }
        catch (error) {
            console.error("Couldn't add user to lobby", error);
            throw new Error("Failed to add user");
        }
    }

    async closeLobby(matchId: number) {
        const match = await this.getMatchById(matchId);
        if (!match) {
            throw new Error("fk all the checks man");
        }
        match.isLobbyOpen = false;

        return await this.matchRepo.save(match);
    }

    async getOpenLobbies() {
        return await this.matchRepo.find({
            where: {
                isLobbyOpen: true,
                status: 'pending'
            },
            relations: ['player1', 'player2', 'lobbyParticipants']
        })
    }

    async getUserActiveGames(userId: number) {
        return await this.matchRepo.createQueryBuilder("game")
            .leftJoinAndSelect("game.player1", "player1")
            .leftJoinAndSelect("game.player2", "player2")
            .leftJoinAndSelect("game.lobbyParticipants", "participants")
            .where("(player1.id = :userId OR player2.id = :userId)", { userId })
            .andWhere("gameStatus IN (:...statuses)", { statuses: ['pending', 'ongoing', 'paused'] })
            .getMany()
    }
}
