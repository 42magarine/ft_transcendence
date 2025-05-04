import game from "../../routes/game.js";
import user from "../../routes/user.js";
import { AppDataSource } from "../DataSource.js";
import { GameModel } from "../models/GameModel.js";
import { MatchService } from "./MatchService.js";
import { UserService } from "./UserService.js";

export class GameService extends MatchService{

	private gameRepo = AppDataSource.getRepository(GameModel);

	constructor(userService: UserService) {
		super(userService);
	}

	async getGameById(id: number)
	{
		return await this.gameRepo.findOne({
			where: { id },
			relations: ['player1', 'player2', 'winner', 'lobbyParticipants'] //lobbyparts is neu fuer det tournuerii ich werd wahnsinig
		})
	}

	async updateGameScore(gameId: number, player1Score: number, player2Score: number, winnerId?: number)
	{
		const game = await this.getGameById(gameId);

		if (!game)
		{
			throw new Error("game not found")
		}

		game.player1Score = player1Score;
		game.player2Score = player2Score;

		if (winnerId)
		{
			const winner = await this.userService.findId(winnerId)
			if (!winner)
				throw new Error("Couldn't find winner in users")
			game.winner = winner;
			game.winnerId = winnerId;
			game.status = 'completed'
			game.endedAt = new Date();
		}

		return await this.saveGame(game);
	}

	async saveGame(game: GameModel)
	{
		return await this.gameRepo.save(game)
	}

	async deleteGame(gameId: number)
	{
		const game = await this.getGameById(gameId)
		if (!game)
			throw new Error("couldnt do it")
		return await this.gameRepo.remove(game)
	}

	async findGameByPlayerId(playerId: number)
	{
		return await this.gameRepo.createQueryBuilder("game")
		.leftJoinAndSelect("game.player1", "player1")
		.leftJoinAndSelect("game.player2", "player2")
		.leftJoinAndSelect("game.winnder", "winner")
		.where("player1.id = :id", {id: playerId})
		.orWhere("player2.id = :id", {id: playerId})
		.orderBy("game.id", "DESC")
		.getMany();
	}

	async findPendingLobbyGames() {
		return await this.gameRepo.createQueryBuilder("game")
		.leftJoinAndSelect("game.player1", "player1")
		.leftJoinAndSelect("game.player2", "player2")
		.where("game.status = :status", {status: 'pending'})
		.andWhere("game.isLobbyOpen = :isOpen", {isOpen: true})
		.getMany()
	}

	async setWinner(gameId: number, winnerId: number)
	{
		const game = await this.getGameById(gameId)

		if (!game)
			throw new Error("Did not know this game blabla adwdoajwdioajwdo")

		const winner = await this.userService.findId(winnerId);
		if (!winner)
			throw new Error("couldnt find winner")

		game.winner = winner;
		game.winnerId = winnerId;
		game.status = 'completed'
		game.endedAt = new Date();

		return await this.saveGame(game);
	}

	protected async getUsernameById(userId: number)
	{
		const user = await this.userService.findId(userId)
		return user?.username;
	}

	protected getGameResult(game: GameModel, userId: number)
	{
		if (!game.winnerId)
			return "In Progress"

		return game.winnerId === userId ? "Won" : "Lost"
	}

	async createGame(player1Id: number, player2Id: number)
	{

		const player1 = await this.userService.findId(player1Id);
		const player2 = await this.userService.findId(player2Id);

		const game = new GameModel()
		game.player1 = player1;
		if (player2 && player1Id !== player2Id)
			game.player2 = player2;
		else
			game.isLobbyOpen = true;
		game.player1Score = 0;
		game.player2Score = 0;
		game.status = 'pending'
		game.isLobbyOpen = true;
		game.gameAdminId = player1Id;

		game.lobbyParticipants = [player1!]

		return await this.saveGame(game)
	}

	async getGameStateById(gameId: number, userId: number)
	{
		const game = await this.getGameById(gameId);
		if (!game)
			throw new Error("adjaowdhaiowdn AHHHHHHHH FKIN TYPESCIPRTYa wda awD AWd")

		const isPlayer1 = game.player1?.id === userId;
		const isPlayer2 = game.player2?.id === userId;

		return {
		  id: game.id,
		  status: game.status,
		  player1: {
			id: game.player1?.id,
			username: game.player1?.username,
			score: game.player1Score
		  },
		  player2: {
			id: game.player2?.id,
			username: game.player2?.username,
			score: game.player2Score
		  },
		  winner: game.winnerId ? {
			id: game.winner?.id,
			username: game.winner?.username
		  } : null,
		  createdAt: game.createdAt,
		  startedAt: game.startedAt,
		  endedAt: game.endedAt,
		  isYourTurn: !game.startedAt, // <-- is nur fuer tictactoe spaeter vll auch eh egal
		  yourRole: isPlayer1 ? 'player1' : (isPlayer2 ? 'player2' : 'spectator'),
		  result: this.getMatchResult(game, userId)
		};
	}

	async addLobbyParticipant(gameId: number, userId: number) {
        try {
            const game = await this.getGameById(gameId);
            const user = await this.userService.findId(userId);

            if (!game || !user)
			{
                throw new Error("Couldn't find correct game/user");
            }

            if (!game.lobbyParticipants)
			{
                game.lobbyParticipants = [];
            }

            const existingParticipant = game.lobbyParticipants.find(p => p.id === userId);
			if (!existingParticipant)
			{
				game.lobbyParticipants.push(user);
			}

			if (game.lobbyParticipants.length === 2 && !game.player2?.id && game.player1?.id !== userId) {
				game.player2 = user;
			}

			return await this.saveGame(game);
    	}
         catch (error) {
            console.error("Couldn't add user to lobby", error);
            throw new Error("Failed to add user");
        }
    }

	async closeLobby(gameId: number)
	{
		const game = await this.getGameById(gameId)
		if(!game)
		{
			throw new Error("fk all the checks man")
		}

		game.isLobbyOpen = false;
		return await this.saveGame(game);
	}

	async getOpenLobbies() {
		return await this.gameRepo.find({
			where: {
				isLobbyOpen: true,
				status: 'pending'
			},
			relations: ['player1', 'lobbyParticipants']
		})
	}

	async getUserActiveGames(userId: number)
	{
		return await this.gameRepo.createQueryBuilder("game")
		.leftJoinAndSelect("game.player1", "player1")
		.leftJoinAndSelect("game.player2", "player2")
		.leftJoinAndSelect("game.lobbyParticipants", "participants")
		.where("(player1.id = :userId OR player2.id = :userId)", {userId})
		.andWhere("gameStatus IN (:...statuses)", {statuses: ['pending', 'ongoing', 'paused']})
		.getMany()
	}
}