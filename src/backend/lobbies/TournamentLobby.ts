import { match } from "assert";
import { LobbyInfo, ServerMessage } from "../../types/interfaces.js";
import { Player } from "../gamelogic/components/Player.js";
import { TournamentService } from "../services/TournamentService.js";
import { GameLobby } from "./GameLobby.js";
import { MatchLobby } from "./MatchLobby.js";

export class TournamentLobby extends MatchLobby {
    private _tournamentService: TournamentService
    private _tournamentId: number | null = null;
    private _currentMatches: Map<string, GameLobby> = new Map();
    private _rounds: number = 0;
    private _currentRound: number = 0;
    private _bracket: any = null;


    constructor(
        id: string,
        broadcast: (lobbyId: string, data: ServerMessage) => void,
        tournamentService: TournamentService,
        options?: {
            name?: string,
            maxPlayers?: number,
            isPublic?: boolean,
            password?: string
        }
    )
    {
        super(id, broadcast, tournamentService, {
            ...options, maxPlayers: options?.maxPlayers || 8,
            lobbyType: 'tournament'
        })

        this._tournamentService = tournamentService
    }

    protected onPlayerAdded(player: Player): void {
        if (this._tournamentId) {
            this.sendTournamentState(player)
        }
    }

    protected onPlayerRemoved(player: Player): void {
        if (this._gameStarted && player.userId) {
            this.handlePlayerForfeit(player.userId);
        }
    }

    private sendTournamentState(player: Player) {
        if (!this._tournamentId) return;

        this._tournamentService.getTournamentById(this._tournamentId)
        .then(tournament => {
            if (tournament && player.connection.readyState === WebSocket.OPEN)
            {
                player.connection.send(JSON.stringify({
                    type: "tournamentState",
                    tournament: {
                        id: tournament.id,
                        bracket: tournament.bracket,
                        currentRound: this._currentRound,
                        totalRonds: this._rounds
                    }
                }))
            }
        })
    }

    public async startGame(): Promise<void> {
        if (this._gameStarted || this._players.size < 2)
            return;

        // handle tournament start logic here like limit player sizes or handle players taking a break

        const playerIds = Array.from(this._players.values())
        .filter(p => p.userId !== null)
        .map(p => p.userId!)

        const tournament = await this._tournamentService.createTournament(playerIds);
        this._tournamentId = tournament.id;

        this._rounds = Math.log2(this._players.size);
        this._currentRound = 1;
        this._bracket = tournament.bracket;

        this._broadcast(this._id, {
            type: "tournamentStarted",
            tournamentId: this._tournamentId,
            bracket: this._bracket,
            rounds: this._rounds
        })

        this.startRoundMatches(1);
    }

    private async startRoundMatches(roundNumber: number) {
        if (!this._tournamentId || !this._bracket) return

        const round = this._bracket.rounds.find((r: any) => r.roundNumber === roundNumber)
        if (!round) return;

        for (const match of round.matches) {
            if (match.player1Id === undefined || match.player2Id === undefined)
                continue;

            const matchLobbyId = `${this._id}_r${roundNumber}_m${match.matchId}`
            const matchLobby = new GameLobby(
                matchLobbyId,
                this._broadcast,
                this._tournamentService.getGameService()
            )

            this._currentMatches.set(matchLobbyId, matchLobby)

            matchLobby.startGame()

            this._broadcast(this._id, {
                type: "matchStarted",
                matchId: match.matchId,
                roundNumber,
                player1Id: match.player1Id,
                player2Id: match.player2Id
            })
        }
    }

    private async handleMatchComplete(matchLobbyId: string, winnerId: number)
    {
        //find matches in bracket, assign winners, updatetournament match result, mark round complete, advance winnerIds to next round
    }

    private async advanceToNextRound(completedRoundNumber: number)
    {
        //advance round number, pair winners for next round, update brackets, broadcast new matchings
    }

    private async finalizeTournament()
    {
        //get final winner, update in db, announce results, closeLobby
    }

    private async handlePlayerForfeit(userId: number){
        if (this._gameStarted && this._tournamentId) {
            for (const [lobbyId, matchLobby] of this._currentMatches.entries())
            {
                const players = Array.from(matchLobby._players.values())
                const playerInMatch = players.find(p => p.userId === userId)

                if (playerInMatch) {
                    const opponent = players.find(p => p.userId !== userId)
                    if (opponent)
                    {
                        await this.handleMatchComplete(lobbyId, opponent.userId!)

                        matchLobby.stopGame();
                    }
                }
            }
        }
    }

    public async stopGame(): Promise<void> {
        if (!this._gameStarted)
            return;

        for (const matchLobby of this._currentMatches.values())
        {
            await matchLobby.stopGame();
        }

        this._currentMatches.clear();
        this._gameStarted = false;

        this._broadcast(this._id, {
            type: "tournamentStopped"
        })
        }
}