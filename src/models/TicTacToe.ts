import { Player } from "./Player.js";

export class TicTacToe {
	private board: Player[] = new Array(9).fill("");
	private currentPlayer: Player = "x";
	private gameOver: boolean = false;
	private readonly winPatterns: number[][] = [
		[0, 1, 2], [3, 4, 5], [6, 7, 8],
		[0, 3, 6], [1, 4, 7], [2, 5, 8],
		[0, 4, 8], [2, 4, 6]
	];

	getBoard(): Player[] {
		return [...this.board];
	}

	getCurrentPlayer(): Player {
		return this.currentPlayer;
	}

	makeMove(index: number): { type: string, board: Player[]; player: Player, win?: boolean; draw?: boolean } {
		if (this.gameOver || this.board[index] !== "") {
			return {
				type: "invalidMove",
				board: this.board,
				player: this.currentPlayer,
			};
		}

		this.board[index] = this.currentPlayer;

		if (this.checkWinner()) {
			this.gameOver = true;
			return {
				type: "updateBoard",
				board: this.board,
				player: this.currentPlayer,
				win: true
			};
		}

		if (this.checkDraw()) {
			this.gameOver = true;
			return {
				type: "updateBoard",
				board: this.board,
				player: this.currentPlayer,
				draw: true
			};
		}

		this.switchPlayer();
		return {
			type: "updateBoard",
			board: this.board,
			player: this.currentPlayer
		};
	}

	resetGame(): { type: string, board: Player[] } {
		this.board.fill("");
		this.currentPlayer = "x";
		this.gameOver = false;
		return {
			type: "resetBoard",
			board: this.board,
		};
	}

	private switchPlayer(): void {
		this.currentPlayer = this.currentPlayer === "x" ? "o" : "x";
	}

	private checkWinner(): boolean {
		return this.winPatterns.some(([a, b, c]) =>
			this.board[a] !== "" &&
			this.board[a] === this.board[b] &&
			this.board[b] === this.board[c]
		);
	}

	private checkDraw(): boolean {
		return this.board.every(cell => cell !== "");
	}
}
