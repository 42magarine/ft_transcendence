import game from "../../routes/game.js";
import user from "../../routes/user.js";
import { AppDataSource } from "../DataSource.js";
import { GameModel } from "../models/GameModel.js";
import { UserService } from "./UserService.js";

export class GameService {

	private _gameRepo: GameRepository;
	private _userService: UserService;

	constructor(gameRepo: GameRepository, userService: UserService)
	{
		this._gameRepo = gameRepo;
		this._userService = userService;
	}

	public async createGame(player1Id: number, player2Id: number) {
		try{
			const player1 = await this._userService.findId(player1Id)
			const player2 = await this._userService.findId(player2Id)

			if (!player1 || !player2) {
				throw new Error("One or both players not registered")
			}

			const game = new GameModel();
			game.Player1 = player1;
			game.Player2 = player2;
			game.Player1Score = 0;
			game.Player2Score = 0;

			return await this._gameRepo.createGame(game);
		}
		catch (error) {
			console.error("Couldnt create game:", error );
			throw new Error("Failed to create game");
		}
	}


	public async updateGameScore(
		gameId: number,
		player1Score: number,
		player2Score: number,
		WinnerId?: number
	)
	{
		try {
			const game = await this._gameRepo.findGameById(gameId)

			if(!game) {
				throw new Error("game not found");
			}

			game.Player1Score = player1Score;
			game.Player2Score = player2Score;

			if (WinnerId)
				game.WinnerId = WinnerId;

			return await this._gameRepo.createGame(game);
		}
		catch (error) {
			console.error("Couldnt update game:", error)
			throw new Error("Error updating game");
		}
	}

	public async getGameStateById(gameId: number, userId: number) {
		try {
			const game = await this._gameRepo.findGameById(gameId)

			if(!game)
				return null;

			if (game.Player1.Id !== userId && game.Player2.id !== userId)
				throw new Error( "User Not part of game")

			const isPlayer1 = game.Player1.id === userId;

			return {
				id: game.id,
				player: {
					id: userId,
					username: isPlayer1 ? game.Player1.username : game.Player2.username,
					score: isPlayer1 ? game.Player1Score : game.Player2Score
				},
				opponent: {
					id: isPlayer1 ? game.Player2.id : game.Player1.id,
					username: isPlayer1 ? game.Player2.username : game.Player1.username,
					score: isPlayer1 ? game.Player2Score : game.Player1Score
				},
				winner: game.WinnerId ? await this.getUsernameById(game.WinnerId)
				: "Game not finished",
				date: game.CreatedAt || new Date()
			}
		}
		catch (error) {
			console.error("couldnt get game from db", error);
			throw new Error("Error fetching game from db");
		}
	}

	private getGameResult(game: GameModel, userId: number) {
		if (!game.WinnerId)
			return "in Progress"

		return game.WinnerId === userId ? "Won" : "Lost"
	}


	private async getUsernameById(userId: number) {
		try {
			const user = await this._userService.findId(userId)
			return user ? user.username : "Unknown";
		}
		catch (error) {
			return "Unknown"
		}
	}

	public async addLobbyParticipant(gameId: number, userId: number) {
		try {
			const game = await this._gameRepo.findGameById(gameId)
			const user = await this._userService.findId(userId)

			if (!game || !user)
			{
				throw new Error("Couldnt find correct game/user")
			}

			if (!game.lobbyParticipants) {
				game.lobbyParticipants = []
			}

			if (!game.lobbyParticipants.some(p => p.id === userId)) {
				game.lobbyParticipants.push(user);
				await this._gameRepo.createGame(game);
			}
		}
		catch (error) {
			console.error("Couldnt add user to lobby", error)
			throw new Error("Failed to add user")
		}
	}


}

export class GameRepository {

	//get game table from db
	private gameRepo = AppDataSource.getRepository(GameModel);
	// private matchHistory = AppDataSource.getRepository(this.matchHistory);


	//create and save game
	async createGame(game: GameModel)
	{
		return await this.gameRepo.save(game);
	}

	//remove game from db -> doesnt matter if doesnt exist nothing will happen
	async deleteGame(game: GameModel)
	{
		return await this.gameRepo.delete(game);
	}

	async findGameById(id: number)
	{
		return await this.gameRepo.findOneBy({id});
	}

	//find list of games where player 1 or 2 are active
	async findGamebyPlayerId(playerId: number)
	{
		return await this.gameRepo.createQueryBuilder("game")
		.leftJoinAndSelect("game.Player1", "player1")
		.leftJoinAndSelect("game.Player2", "player2")
		.where("player1.id = :id", {id: playerId})
		.orWhere("player2.id = :id", {id: playerId})
		.orderBy("game.id", "DESC")
		.getMany();
	}

	// optional if we want to show how good the opponent is in game lobby -> use matchHistory -> need to add relation to users
	// async getUserStats()
}
