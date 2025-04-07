const headerTitle = document.querySelector("h1") as HTMLHeadingElement;
const gameBoard = document.querySelector(".gameBoard") as HTMLDivElement;
const restartButton = document.querySelector(".restartButton") as HTMLButtonElement;
let cells: HTMLDivElement[] = [];

async function initBoard(): Promise<void> {
    const response = await fetch("/api/game/state");
    const data = await response.json();

    updateBoard(data.board);
}

function updateBoard(board: string[]): void {
    cells.forEach((cell, index) => {
        cell.textContent = board[index];
    });
}

function updateStatus(message: string): void {
    headerTitle.textContent = message;
}

// Event listeners for the game board.
gameBoard.addEventListener("click", async (event: MouseEvent) => {
    const target = event.target as HTMLDivElement;

    if (target.classList.contains("cell")) {
        const index = Number(target.dataset.index);

        const response = await fetch("api/game/move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ index }),
        });

        const data = await response.json();

        if (data.type === "resetBoard") {
            updateBoard(data.board);
            updateStatus("Tic Tac Toe with Typescript");
        }
        else if (data.type === "updateBoard") {
            updateBoard(data.board);

            if (data.win) {
                updateStatus(`${data.player} wins!`);
            }
            else if (data.draw) {
                updateStatus("It's a draw!");
            }
            else {
                updateStatus(`Current player: ${data.player}`);
            }
        }
    }
});

// Event listeners for the restart button.
restartButton.addEventListener("click", async () => {
    const response = await fetch("api/game/reset", { method: "POST" });
    const data = await response.json();

    updateBoard(data.board);
    updateStatus("Tic Tac Toe with Typescript");
});

function createBoard(): void {
    for (let i = 0; i < 9; i++) {
        const cell: HTMLDivElement = document.createElement("div");     // Create a div element for each cell
        cell.classList.add("cell");                                     // Add the "cell" class to style it
        cell.dataset.index = i.toString();                              // Store the index as a string
        gameBoard.appendChild(cell);                                    // Append the cell to the game board
        cells.push(cell);
    }
}

// Initialize the board when the page loads.
window.addEventListener("DOMContentLoaded", () => {
    createBoard();
    initBoard();
});
