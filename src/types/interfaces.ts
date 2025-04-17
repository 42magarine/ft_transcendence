export interface IGameState {
    ball: {
        x: number;
        y: number;
        radius: number;
    };
    paddle1: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    paddle2: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    score1: number;
    score2: number;
    paused: boolean;
    running: boolean;
}
