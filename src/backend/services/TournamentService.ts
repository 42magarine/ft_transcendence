import { AppDataSource } from "../DataSource.js";
import { TournamentModel } from "../models/TournamentModel.js";
import { UserModel } from "../models/UserModel.js";
import { GameService } from "./GameService.js";
import { MatchService } from "./MatchService.js";
import { UserService } from "./UserService.js";

export class TournamentService extends MatchService {
    private tournamentRepo = AppDataSource.getRepository(TournamentModel)

    private gameService: GameService


    constructor(userService: UserService, gameService: GameService) {
        super(userService)
        this.gameService = gameService;
    }

    public getGameService() {
        return this.gameService
    }

    async getTournamentById(id: number)
    {
        return await this.tournamentRepo.findOne({
            where: {id},
            relations: ['participants', 'winner', 'matches']
        })
    }

    async createTournament(playerIds: number[] )
    {
        const playerCount = playerIds.length;

        const players = await Promise.all(
            playerIds.map(id => this.userService.findId(id))
        )

        const tournament = new TournamentModel();
        tournament.participants = players.filter(p => p !== null) as UserModel[]
        tournament.maxParticipants = playerCount;
        tournament.status = 'ongoing'
        tournament.tournamentPhase = 'in_progress'
        tournament.startedAt = new Date();

        const rounds = Math.log2(playerCount);
        tournament.bracket = {
            rounds: this.generateBracket(playerIds, rounds)
        }

        return await this.tournamentRepo.save(tournament);
    }

    private generateBracket(playerIds: number[], rounds: number)
    {
        // gotta simplify the logic to just round robbin
        return [];
    }
}