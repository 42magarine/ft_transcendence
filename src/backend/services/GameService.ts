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
			relations: ['player1', 'player2', 'winner']
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
		game.player2 = player2;
		game.player1Score = 0;
		game.player2Score = 0;

		return await this.saveGame(game)
	}

	async getGameStateById(gameId: number, userId: number)
	{
		return await this.getMatchStateById(gameId, userId)
	}

	async addLobbyParticipant(gameId: number, userId: number) {
        try {
            const game = await this.getGameById(gameId);
            const user = await this.userService.findId(userId);

            if (!game || !user) {
                throw new Error("Couldn't find correct game/user");
            }

            if (!game.lobbyParticipants) {
                game.lobbyParticipants = [];
            }

            if (!game.lobbyParticipants.includes(user)) {
                game.lobbyParticipants.push(user);
                await this.saveGame(game);
            }

            return game;
        } catch (error) {
            console.error("Couldn't add user to lobby", error);
            throw new Error("Failed to add user");
        }
    }
}