// Union Type alias for the player state
type Player = "x" | "o" | "";

// Constants for the board and elements
const game_board = document.querySelector(".game-board") as HTMLDivElement;
const header_title = document.querySelector("h1") as HTMLHeadingElement;
const restart_button = document.querySelector(".restart-button") as HTMLButtonElement;

// Initial game state
let current_player: Player = "x";
let board_state: Player[] = new Array(9).fill("");
let game_over: boolean = false;

const win_patterns: number[][] = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],    // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8],    // Columns
    [0, 4, 8], [2, 4, 6]                // Diagonals
];

function main(): void {
    create_board();
    add_event_listeners();
    reset_game();
}

function create_board(): void {
    for (let i = 0; i < 9; i++) {
        const cell: HTMLDivElement = document.createElement("div");     // Create a div element for each cell
        cell.classList.add("cell");                                     // Add the "cell" class to the div to style it
        cell.dataset.index = i.toString();                              // Store index as string
        game_board.appendChild(cell);                                   // Append the cell to the game board (this adds it to the DOM)
    }
}

function add_event_listeners(): void {
    game_board.addEventListener("click", handle_board_click);
    restart_button.addEventListener("click", reset_game);
}

function reset_game(): void {
    board_state.fill("");
    current_player = "x";
    game_over = false;
    header_title.textContent = "Tic Tac Toe with Typescript";

    // Clear all cell contents
    document.querySelectorAll(".cell").forEach(cell => {
        (cell as HTMLDivElement).textContent = "";
    });

    // Re-enable click event
    game_board.addEventListener("click", handle_board_click);
}

function handle_board_click(event: MouseEvent): void {
    const target = event.target as HTMLDivElement;
    const index: number = Number(target.dataset.index);

    if (target.classList.contains("cell") && target.textContent === "") {
        target.textContent = current_player;
        board_state[index] = current_player;

        if (check_winner()) {
            game_over = true;
            header_title.textContent = `${current_player} wins!`;
            game_board.removeEventListener("click", handle_board_click);
            return;
        }

        if (check_draw()) {
            game_over = true;
            header_title.textContent = "It's a draw!";
            game_board.removeEventListener("click", handle_board_click);
            return;
        }

        switch_player();
    }
}

function switch_player(): void {
    current_player = current_player === "x" ? "o" : "x";
}

function check_winner(): boolean {
    return win_patterns.some(([a, b, c]) =>
        board_state[a] !== "" &&
        board_state[a] === board_state[b] &&
        board_state[b] === board_state[c]
    );
}

function check_draw(): boolean {
    return board_state.every(cell => cell !== "");
}

main();
