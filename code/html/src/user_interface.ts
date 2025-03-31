const socket: WebSocket = new WebSocket("ws://localhost:3000/ws");
const gameBoard = document.querySelector(".gameBoard") as HTMLDivElement;
const headerTitle = document.querySelector("h1") as HTMLHeadingElement;
const restartButton = document.querySelector(".restartButton") as HTMLButtonElement;

// The "open" event is triggered when the connection to the WebSocket server is successfully established.
socket.addEventListener("open", () => {
    console.log("Connected to WebSocket server");
});

// The "message" event is triggered when the server sends a message over WebSocket.
socket.addEventListener("message", (event: MessageEvent<string>) => {
    const data = JSON.parse(event.data);

    if (data.type === "init" || data.type === "update" || data.type === "reset") {
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
});

function updateBoard(board: string[]): void {
    document.querySelectorAll(".cell").forEach((cell, index) => {
        cell.textContent = board[index];
    });
}

function updateStatus(message: string): void {
    headerTitle.textContent = message;
}

// Event listeners for the game board.
gameBoard.addEventListener("click", (event: MouseEvent) => {
    const target = event.target as HTMLDivElement;
    if (target.classList.contains("cell")) {
        const index = Number(target.dataset.index);
        socket.send(JSON.stringify({ type: "move", index }));
    }
});

// Event listeners for the restart button.
restartButton.addEventListener("click", () => {
    socket.send(JSON.stringify({ type: "reset" }));
});

function createBoard(): void {
    // const gameBoard = document.querySelector(".game-board") as HTMLDivElement;
    // gameBoard.innerHTML = ""; // Clear the board to prevent duplicates

    for (let i = 0; i < 9; i++) {
        const cell: HTMLDivElement = document.createElement("div");     // Create a div element for each cell
        cell.classList.add("cell");                                     // Add the "cell" class to style it
        cell.dataset.index = i.toString();                              // Store the index as a string
        gameBoard.appendChild(cell);                                    // Append the cell to the game board
    }
}

// Initialize the board when the page loads.
window.addEventListener("DOMContentLoaded", createBoard);
