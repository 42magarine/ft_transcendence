// Union Type alias for the player state
export type Player = "x" | "o" | "";

export class TicTacToe {
    private board: Player[] = new Array(9).fill("");
    private currentPlayer: Player = "x";
    private gameOver: boolean = false;
    private readonly winPatterns: number[][] = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],    // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8],    // Columns
        [0, 4, 8], [2, 4, 6]                // Diagonals
    ];

    getBoard(): Player[] {
        return [...this.board];     // Return a copy
    }

    getCurrentPlayer(): Player {
        return this.currentPlayer;
    }

    makeMove(index: number): { board: Player[]; player: Player, win?: boolean; draw?: boolean } {
        if (this.gameOver || this.board[index] !== "") {
            return { board: this.board, player: this.currentPlayer };
        }

        this.board[index] = this.currentPlayer;

        if (this.checkWinner()) {
            this.gameOver = true;
            return { board: this.board, player: this.currentPlayer, win: true };
        }

        if (this.checkDraw()) {
            this.gameOver = true;
            return { board: this.board, player: this.currentPlayer, draw: true };
        }

        this.switchPlayer();
        return { board: this.board, player: this.currentPlayer };
    }

    resetGame(): { board: Player[]; player: Player } {
        this.board.fill("");
        this.currentPlayer = "x";
        this.gameOver = false;
        return { board: this.board, player: this.currentPlayer };
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
