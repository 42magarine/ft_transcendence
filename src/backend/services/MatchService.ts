import { AppDataSource } from "../DataSource.js";
import { MatchModel } from "../models/MatchModel.js";
import { UserService } from "./UserService.js";

export abstract class MatchService {

    protected matchRepo = AppDataSource.getRepository(MatchModel);
    protected userService: UserService;

    constructor(userService: UserService)
    {
        this.userService = userService;
    }

    async getMatchById(id: number)
    {
        return await this.matchRepo.findOne({
            where: { id },
            relations: ['player1', 'player2', 'winner']
        })
    }

    async updateScore(matchId: number, player1Score: number, player2Score: number)
    {
        const match = await this.getMatchById(matchId);

        if (!match)
        {
            throw new Error("match not found")
        }

        match.player1Score = player1Score;
        match.player2Score = player2Score;

        return await this.saveMatch(match);
    }

    async saveMatch(match: MatchModel)
    {
        return await this.matchRepo.save(match)
    }

    async deleteMatch(matchId: number)
    {
        const match = await this.getMatchById(matchId)
        if (!match)
            throw new Error("couldnt do it")
        return await this.matchRepo.remove(match)
    }

    async findMatchByPlayerId(playerId: number)
    {
        return await this.matchRepo.createQueryBuilder("match")
        .leftJoinAndSelect("match.player1", "player1")
        .leftJoinAndSelect("match.player2", "player2")
        .leftJoinAndSelect("match.winnder", "winner")
        .where("player1.id = :id", {id: playerId})
        .orWhere("player2.id = :id", {id: playerId})
        .orderBy("match.id", "DESC")
        .getMany();
    }


    async setWinner(matchId: number, winnerId: number)
    {
        const match = await this.getMatchById(matchId)

        if (!match)
            throw new Error("Did not know this match blabla adwdoajwdioajwdo")

        const winner = await this.userService.findId(winnerId);
        if (!winner)
            throw new Error("couldnt find winner")

        match.winner = winner;
        match.winnerId = winnerId;

        return await this.saveMatch(match);
    }

    protected async getUsernameById(userId: number)
    {
        const user = await this.userService.findId(userId)
        return user?.username;
    }

    protected getMatchResult(match: MatchModel, userId: number)
    {
        if (!match.winnerId)
            return "In Progress"

        return match.winnerId === userId ? "Won" : "Lost"
    }

    async createMatch(player1Id: number, player2Id: number)
    {

        const player1 = await this.userService.findId(player1Id);
        const player2 = await this.userService.findId(player2Id);

        const match = new MatchModel()
        match.player1 = player1;
        match.player2 = player2;
        match.player1Score = 0;
        match.player2Score = 0;

        return await this.saveMatch(match)
    }

    async getMatchStateById(matchId: number, userId: number)
    {
        const match = await this.getMatchById(matchId);
        if(!match)
            throw new Error("match doesnt exist");

        return this.getMatchResult(match, userId);
    }

}