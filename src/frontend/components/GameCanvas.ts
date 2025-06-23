// components/GameCanvas.ts
export default class GameCanvas {
    async renderGameCanvas(): Promise<string> {
        return `
            <div id="gameCanvasWrap" class="m-auto">
                <div id="gameCanvasWrap-overlay"></div>
                <canvas
                    id="gameCanvas"
                    class="bg-black border-4 border-white rounded-lg shadow-lg"
                    width="800"
                    height="600">
                </canvas>
            </div>
        `;
    }
}
