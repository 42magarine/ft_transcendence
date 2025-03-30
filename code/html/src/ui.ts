const socket = new WebSocket("ws://localhost:3000/ws");

console.log("here");


socket.addEventListener("open", () => {
    console.log("Connected to WebSocket server");
});

socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "init" || data.type === "update" || data.type === "reset") {
        updateBoard(data.board);
        if (data.winner) {
            updateStatus(`${data.winner} wins!`);
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
    document.querySelectorAll(".cell").forEach((cell, i) => {
        (cell as HTMLDivElement).textContent = board[i];
    });
}

function updateStatus(message: string): void {
    document.querySelector("h1")!.textContent = message;
}

document.querySelector(".game-board")!.addEventListener("click", (event) => {
    const target = event.target as HTMLDivElement;
    if (target.classList.contains("cell")) {
        const index = Number(target.dataset.index);
        socket.send(JSON.stringify({ type: "move", index }));
    }
});

document.querySelector(".restart-button")!.addEventListener("click", () => {
    socket.send(JSON.stringify({ type: "reset" }));
});


function create_board(): void {
    const game_board = document.querySelector(".game-board") as HTMLDivElement;

    // Clear the board first to avoid duplicates
    game_board.innerHTML = "";

    // Create 9 cells for the Tic-Tac-Toe grid
    for (let i = 0; i < 9; i++) {
        const cell: HTMLDivElement = document.createElement("div");     // Create a div element for each cell
        cell.classList.add("cell");                                     // Add the "cell" class to style it
        cell.dataset.index = i.toString();                              // Store the index as a string
        game_board.appendChild(cell);                                   // Append the cell to the game board
    }
}

create_board(); // Call the function to create the board when the page loads
