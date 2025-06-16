import { Repository } from "typeorm";
import { AppDataSource } from "../DataSource.js";
import { MatchModel } from "../models/MatchModel.js";
import { UserService } from "./UserService.js";
import { TournamentModel } from "../models/MatchModel.js";
import { ITournamentRound } from "../../interfaces/interfaces.js";

export class MatchService {
    public tournamentRepo: Repository<TournamentModel>
    public matchRepo: Repository<MatchModel>;
    public userService: UserService;
    // private userMatchStatRepo: Repository<UserMatchStat>;

    constructor(userService: UserService) {
        this.userService = userService;
        this.tournamentRepo = AppDataSource.getRepository(TournamentModel);
        this.matchRepo = AppDataSource.getRepository(MatchModel);
        // this.userMatchStatRepo = AppDataSource.getRepository(userMatchStat);
    }

    async getMatchById(matchId: number) {
        return await this.matchRepo.findOne({
            where: { matchModelId: matchId },
            relations: ['player1', 'player2', 'winner', 'lobbyParticipants', 'tournament']
        })
    }

    async getMatchLobbyById(lobbyId: string) {
        return await this.matchRepo.findOne({
            where: { lobbyId },
            relations: ['player1', 'player2', 'winner', 'lobbyParticipants', 'tournament']
        })
    }

    async getTournamentById(tournamentId: number): Promise<TournamentModel | null> {
        return await this.tournamentRepo.findOne({
            where: { id: tournamentId },
            relations: ['creator', 'lobbyParticipants']
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
        if (winnerId && winnerId !== 0) {
            const winner = await this.userService.findUserById(winnerId)
            if (!winner) {
                throw new Error("Couldn't find winner in users");
            }
            match.winner = winner;
            match.winnerId = winnerId;
            match.status = 'completed'
            match.endedAt = new Date();
        }

        console.log("calling matchrepo.save from updateScore function");
        return await this.matchRepo.save(match);
    }

    async updateMatchStatus(matchId: number, status: 'pending' | 'ongoing' | 'completed' | 'cancelled', endedAt?: Date) {
        const match = await this.getMatchById(matchId);
        if (!match) {
            throw new Error("no match found")
        }

        match.status = status;
        if (endedAt) {
            match.endedAt = endedAt;
        }
        console.log("calling matchrepo.save from updateMatchStatus function");
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

    async deleteAllMatchesForTournament(tournamentId: number) {
        try {
            await this.matchRepo.delete({ tournament: { id: tournamentId } })
            // console.log("deleteAllMatchesForTournament")
        }
        catch (error) {
            console.error("fkin error ig (Penis)")
            throw error;
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

    async createMatch(lobbyId: string, userId: number, maxPlayers: number, lobbyName: string): Promise<MatchModel> {
        const player1 = await this.userService.findUserById(userId);
        if (player1 == null) {
            throw new Error("User does not exist in DB");
        }

        const match = new MatchModel();
        match.lobbyId = lobbyId;
        match.lobbyName = lobbyName;
        match.createdAt = new Date();
        match.player1 = player1;
        match.player2 = null;
        match.maxPlayers = maxPlayers;
        match.isLobbyOpen = true;
        match.status = "pending";
        match.invitedUserIds = [];
        match.lobbyParticipants = [];
        match.player1Score = 0;
        match.player2Score = 0;
        match.readyStatusMap = [];

        console.log("calling matchrepo.save from createMatch function");
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
        console.log("calling matchrepo.save from addPlayerToMatch function");
        return await this.matchRepo.save(match);
    }

    async removePlayerFromMatch(lobbyId: string, userId: number): Promise<boolean> {
        try {
            const match = await this.getMatchLobbyById(lobbyId);
            if (!match) {
                throw new Error("Match not found");
            }

            if (match.tournament === null) {
                if (match.player1?.id === userId) {
                    if (match.player2) {
                        match.player1 = match.player2;
                        match.player2 = null;
                        await this.matchRepo.save(match);
                    }
                    else {
                        await this.matchRepo.delete({ lobbyId });
                    }
                    return true;
                }
                else if (match.player2?.id === userId) {
                    match.player2 = null;
                    await this.matchRepo.save(match);
                    return true;
                }
                else {
                    console.warn(`awdawd player not funden`);
                    return false;
                }
            }
            else {
                console.log(`alle raus ihr huans.`);
                return false;
            }
        }
        catch (error) {
            console.error("wasn hier los?", error);
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
            console.log("calling matchrepo.save from addLobbyParticipant function");
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

        console.log("calling matchrepo.save from closeLobby function");
        return await this.matchRepo.save(match);
    }

    async getOpenLobbies(): Promise<(MatchModel | TournamentModel)[]> {
        const pendingMatches = await this.matchRepo.find({
            where: {
                isLobbyOpen: true,
                status: 'pending',
                tournament: undefined
            },
            relations: ['player1', 'player2', 'lobbyParticipants']
        });

        const pendingTournaments = await this.tournamentRepo.find({
            where: {
                status: 'pending'
            },
            relations: ['creator', 'lobbyParticipants']
        });

        return [...pendingMatches, ...pendingTournaments];
    }

    async getUserActiveGames(userId: number) {
        return await this.matchRepo.createQueryBuilder("game")
            .leftJoinAndSelect("game.player1", "player1")
            .leftJoinAndSelect("game.player2", "player2")
            .leftJoinAndSelect("game.lobbyParticipants", "participants")
            .leftJoinAndSelect("game.tournament", "tournament")
            .where("(player1.id = :userId OR player2.id = :userId)", { userId })
            .andWhere("gameStatus IN (:...statuses)", { statuses: ['ongoing'] })
            .getMany()
    }

    // new tournier funkies now

    async createTournament(lobbyId: string, creatorId: number, maxPlayers: number, name: string) {
        const creator = await this.userService.findUserById(creatorId)
        if (!creator)
            throw new Error("Wirf Junge WIRF den FEHLER DU BASTARD")

        const tournament = new TournamentModel();
        tournament.lobbyId = lobbyId;
        tournament.creator = creator;
        tournament.name = name;
        tournament.maxPlayers = maxPlayers;
        tournament.createdAt = new Date();
        tournament.status = 'pending';
        tournament.currentRound = 0;
        tournament.playerScores = {};
        tournament.matchSchedule = [];
        tournament.lobbyParticipants = [creator];

        console.log("calling tournament.save from createTournament function");
        return await this.tournamentRepo.save(tournament);
    }

    async addPlayerToTournament(tournamentId: number, userId: number) {
        const tournament = await this.getTournamentById(tournamentId)
        const user = await this.userService.findUserById(userId)

        if (!tournament || !user) {
            throw new Error("irgendwas uwrde nicht angelegt")
        }

        if (!tournament.lobbyParticipants) {
            tournament.lobbyParticipants = []
        }

        const exisitingParticipant = tournament.lobbyParticipants.find(p => p.id === userId)
        if (!exisitingParticipant)
            tournament.lobbyParticipants.push(user);

        console.log("calling tournamentRepo.save from addPlayertoTournament function");
        return await this.tournamentRepo.save(tournament);
    }

    async createTournamentMatch(lobbyId: string, player1Id: number, player2Id: number, tournamentId: number) {
        const player1 = await this.userService.findUserById(player1Id)
        const player2 = await this.userService.findUserById(player2Id)
        const tournament = await this.getTournamentById(tournamentId);

        if (!player1 || !player2 || !tournament) {
            throw new Error("??????????????dawdawd awad AHHHHHHHHHHHHHHHHHHHH ich ahsse typescript")
        }

        const match = new MatchModel()
        match.lobbyId = lobbyId
        match.lobbyName = `Random ass fkin name so here you Go ${player1.username} ${player2.username}`
        match.createdAt = new Date()
        match.player1 = player1;
        match.player2 = player2;
        match.maxPlayers = 2;
        match.isLobbyOpen = false;
        match.status = "pending"
        match.invitedUserIds = []
        match.lobbyParticipants = [player1, player2]
        match.player1Score = 0
        match.player2Score = 9
        match.readyStatusMap = []
        match.tournament = tournament

        return await this.matchRepo.save(match);
    }

    async updateTournamentStatus(tournamentId: number, status: 'pending' | 'cancelled' | 'completed' | 'ongoing', endedAt: Date) {
        const tournament = await this.getTournamentById(tournamentId);
        if (!tournament) {
            throw new Error(`Tournament with ID ${tournamentId} not found.`);
        }
        tournament.status = status;
        if (endedAt) {
            tournament.endedAt = endedAt;
        }
        return await this.tournamentRepo.save(tournament);
    }

    async updateTournamentCompletion(tournamentId: number, winnerId: number | undefined, endedAt: Date) {
        const tournament = await this.getTournamentById(tournamentId)
        if (!tournament) {
            throw new Error("Oh hell nah bruv")
        }

        tournament.status = 'completed'
        tournament.endedAt = endedAt;
        if (winnerId) {
            const winner = await this.userService.findUserById(winnerId)
            if (winner) {
                tournament.winner = winner;
            }
        }
        return await this.tournamentRepo.save(tournament);
    }

    async updateTournamentSchedule(tournamentId: number, schedule: ITournamentRound[]) {
        await this.tournamentRepo.update(tournamentId, { matchSchedule: schedule })
    }

    async updateTournamentPlayerPoints(tournamentId: number, playerPoints: { [userId: number]: number }) {
        await this.tournamentRepo.update(tournamentId, { playerScores: playerPoints })
    }

    public async cleanupCrashed() {
        const ongoingRegularMatches = await this.matchRepo.find({
            where: { status: 'ongoing', tournament: undefined }
        })
        if (ongoingRegularMatches.length > 0) {
            const matchIds = ongoingRegularMatches.map(m => m.matchModelId);
            await this.matchRepo.delete(matchIds);
        }
    }
}
