import { AppDataSource } from "../DataSource.js";
import { TournamentMatchModel, TournamentModel } from "../models/TournamentModel.js";
import { UserModel } from "../models/UserModel.js";
import { GameService } from "./GameService.js";
import { MatchService } from "./MatchService.js";
import { UserService } from "./UserService.js";

export class TournamentService extends MatchService {
    private tournamentRepo = AppDataSource.getRepository(TournamentModel)
    private tournamentMatchRepo = AppDataSource.getRepository(TournamentMatchModel)

    constructor(userService: UserService)
    {
        super(userService)
    }

    async createTournament(name: string, creatorId: number, maxPlayers: number = 4) {
        const creator = await this.userService.findId(creatorId)
        if(!creator)
            throw new Error("Creator not found")

        const tournament = new TournamentModel();
        // tournament.name = name;
        // tournament.creator = creator;
        // tournament.creatorId = creatorId;
        // tournament.maxPlayers = maxPlayers;
        tournament.status = 'pending'
        tournament.participants = [creator]

        return await this.tournamentRepo.save(tournament)
    }

    async getTournamentById(id: number) {
        return await this.tournamentRepo.findOne({
            where: {id},
            relations: ['participants', 'creator', 'matches', 'matches.player1', 'matches.player2', 'matches.winner',]
        })
    }

    async addParticipant(tournamentId: number, userId: number)
    {
        const tournament = await this.getTournamentById(tournamentId)
        if(!tournament)
            throw new Error("aahahahahahaha")

        if (tournament.status !== 'pending' || tournament.participants.length >= tournament.maxParticipants)
            throw new Error("you shouldn dawdad mate lol kakakaka")

        const user = await this.userService.findId(userId)
        if(!user)
            throw new Error("dich gibs nich lol")

        const isParticipant = tournament.participants.some(p => p.id === userId)
        if (!isParticipant)
            tournament.participants.push(user);

        return await this.tournamentRepo.save(tournament);
    }

    async startTournament(tournamenId: number) {
        const tournament = await this.getTournamentById(tournamenId)
        if(!tournament)
            throw new Error("aahahahahahaha")

        if (tournament.status !== 'pending' || tournament.participants.length < 2)
            throw new Error("you shouldn dawdad mate lol kakakaka")

        tournament.status = 'ongoing'
        tournament.startedAt = new Date()

        const players = tournament.participants
        const matches: TournamentMatchModel[] = []

        for (let i = 0; i < players.length; i++){
            for (let j = i + 1; j < players.length; j++)
            {
                const match = new TournamentMatchModel()
                match.tournament = tournament
                match.tournamentId = tournament.id
                match.player1 = players[i]
                match.player2 = players[j]
                match.player1Score = 0;
                match.player2Score = 0;
                match.status = 'pending'
                match.matchNumber = matches.length + 1

                matches.push(await this.tournamentMatchRepo.save(match))
            }
        }
        // tournament.matches = matches;
        return await this.tournamentRepo.save(tournament)
    }

    async getTournamentStandings(tournamentId: number)
    {
        const tournament = await this.getTournamentById(tournamentId)
        if(!tournament)
            throw new Error("adawdawdaw")

        const standings: Record<number, {
            userId: number,
            username: string,
            points: number,
            wins: number,
            draws: number,
            losses: number
        }> = {};


        tournament.participants.forEach(player => {
            standings[player.id] = {
                userId: player.id,
                username: player.username,
                points: 0,
                wins: 0,
                draws: 0,
                losses: 0
            };
        });

        tournament.matches.forEach(match => {
            if (match.status !== 'completed') return;

            const player1 = standings[match.player1.id];
            const player2 = standings[match.player2.id];

            if (match.player1Score > match.player2Score) {
                player1.points += 3;
                player1.wins += 1;
                player2.losses += 1;
            } else if (match.player1Score < match.player2Score) {
                player2.points += 3;
                player2.wins += 1;
                player1.losses += 1;
            } else {
                player1.points += 1;
                player2.points += 1;
                player1.draws += 1;
                player2.draws += 1;
            }
        });

        return Object.values(standings).sort((a, b) => b.points - a.points);
    }

    async updateMatchScore(matchId: number, player1Score: number, player2Score: number): Promise<TournamentMatchModel> {
        const match = await this.tournamentMatchRepo.findOne({
            where: { id: matchId },
            relations: ['player1', 'player2', 'tournament']
        });

        if (!match) {
            throw new Error("Match not found");
        }

        match.player1Score = player1Score;
        match.player2Score = player2Score;

        if (match.player1Score !== match.player2Score) {
            const winnerId = match.player1Score > match.player2Score ? match.player1.id : match.player2.id;
            const winner = match.player1Score > match.player2Score ? match.player1 : match.player2;
            match.winnerId = winnerId;
            match.winner = winner;
        }

        match.status = 'completed';
        match.endedAt = new Date();

        await this.tournamentMatchRepo.save(match);

        await this.checkTournamentCompletion(match.tournamentId);

        return match;
    }

    private async checkTournamentCompletion(tournamentId: number): Promise<void> {
        const tournament = await this.getTournamentById(tournamentId);
        if (!tournament) return;

        const allMatchesCompleted = tournament.matches.every(match => match.status === 'completed');

        if (allMatchesCompleted && tournament.status === 'ongoing') {
            tournament.status = 'completed';
            tournament.endedAt = new Date();

            const standings = await this.getTournamentStandings(tournamentId);
            if (standings.length > 0) {
                const winner = await this.userService.findId(standings[0].userId);
                if (winner) {
                    tournament.winnerId = winner.id;
                    tournament.winner = winner;
                }
            }

            await this.tournamentRepo.save(tournament);
        }
    }

    async getActiveTournaments(): Promise<TournamentModel[]> {
        return await this.tournamentRepo.find({
            where: { status: 'pending' },
            relations: ['creator', 'participants']
        });
    }

    async getUserTournaments(userId: number): Promise<TournamentModel[]> {
        const tournaments = await this.tournamentRepo.createQueryBuilder("tournament")
            .leftJoinAndSelect("tournament.participants", "participants")
            .leftJoinAndSelect("tournament.creator", "creator")
            .where("participants.id = :userId", { userId })
            .getMany();

        return tournaments;
    }
}
