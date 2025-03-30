export type Player = "x" | "o" | "";

// Represents the game state
export class TicTacToe {
    private board: Player[] = new Array(9).fill("");
    private currentPlayer: Player = "x";
    private gameOver: boolean = false;

    private winPatterns: number[][] = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],    // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8],    // Columns
        [0, 4, 8], [2, 4, 6]                // Diagonals
    ];

    getBoard(): Player[] {
        return [...this.board]; // Return a copy to prevent direct modification
    }

    getCurrentPlayer(): Player {
        return this.currentPlayer;
    }

    makeMove(index: number): { board: Player[]; winner?: Player; draw?: boolean } {
        if (this.gameOver || this.board[index] !== "") return { board: this.board };

        this.board[index] = this.currentPlayer;

        if (this.checkWinner()) {
            this.gameOver = true;
            return { board: this.board, winner: this.currentPlayer };
        }

        if (this.board.every(cell => cell !== "")) {
            this.gameOver = true;
            return { board: this.board, draw: true };
        }

        this.currentPlayer = this.currentPlayer === "x" ? "o" : "x";
        return { board: this.board };
    }

    resetGame(): { board: Player[] } {
        this.board.fill("");
        this.currentPlayer = "x";
        this.gameOver = false;
        return { board: this.board };
    }

    private checkWinner(): boolean {
        return this.winPatterns.some(([a, b, c]) =>
            this.board[a] !== "" &&
            this.board[a] === this.board[b] &&
            this.board[b] === this.board[c]
        );
    }
}
