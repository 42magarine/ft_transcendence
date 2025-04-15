var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { CreateDateColumn, Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, JoinColumn, ManyToOne } from "typeorm";
import { UserModel } from "./User.Model.js";
let TournamentModel = class TournamentModel {
    utid;
    tournamendAdminId;
    participants;
    minPlayers;
    maxPlayers;
    rounds;
    status;
    createdAt;
    startedAt;
    endedAt;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], TournamentModel.prototype, "utid", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Number)
], TournamentModel.prototype, "tournamendAdminId", void 0);
__decorate([
    ManyToMany(() => UserModel),
    JoinTable(),
    __metadata("design:type", Array)
], TournamentModel.prototype, "participants", void 0);
__decorate([
    Column({ default: 4 }),
    __metadata("design:type", Number)
], TournamentModel.prototype, "minPlayers", void 0);
__decorate([
    Column({ default: 8 }),
    __metadata("design:type", Number)
], TournamentModel.prototype, "maxPlayers", void 0);
__decorate([
    OneToMany(() => TournamentRoundModel, (round) => round.tournament),
    __metadata("design:type", Array)
], TournamentModel.prototype, "rounds", void 0);
__decorate([
    Column({ default: 'pending' }),
    __metadata("design:type", String)
], TournamentModel.prototype, "status", void 0);
__decorate([
    CreateDateColumn({ type: 'datetime' }),
    __metadata("design:type", Date)
], TournamentModel.prototype, "createdAt", void 0);
__decorate([
    Column({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], TournamentModel.prototype, "startedAt", void 0);
__decorate([
    Column({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], TournamentModel.prototype, "endedAt", void 0);
TournamentModel = __decorate([
    Entity()
], TournamentModel);
export { TournamentModel };
let TournamentRoundModel = class TournamentRoundModel {
    urid;
    roundNumber;
    tournament;
    matches;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], TournamentRoundModel.prototype, "urid", void 0);
__decorate([
    Column(),
    __metadata("design:type", Number)
], TournamentRoundModel.prototype, "roundNumber", void 0);
__decorate([
    ManyToOne(() => TournamentModel, (tournament) => tournament.rounds),
    JoinColumn({ name: 'tournamentId' }),
    __metadata("design:type", TournamentModel)
], TournamentRoundModel.prototype, "tournament", void 0);
__decorate([
    OneToMany(() => TournamentMatchModel, (match) => match.round),
    __metadata("design:type", Array)
], TournamentRoundModel.prototype, "matches", void 0);
TournamentRoundModel = __decorate([
    Entity()
], TournamentRoundModel);
export { TournamentRoundModel };
let TournamentMatchModel = class TournamentMatchModel {
    umid;
    round;
    player1;
    player2;
    winnerId;
    winner;
    status;
    startedAt;
    endedAt;
    player1Score;
    player2Score;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], TournamentMatchModel.prototype, "umid", void 0);
__decorate([
    ManyToOne(() => TournamentRoundModel, (round) => round.matches),
    JoinColumn({ name: 'roundId' }),
    __metadata("design:type", TournamentModel)
], TournamentMatchModel.prototype, "round", void 0);
__decorate([
    ManyToOne(() => UserModel),
    JoinColumn({ name: 'player1Id' }),
    __metadata("design:type", UserModel)
], TournamentMatchModel.prototype, "player1", void 0);
__decorate([
    ManyToOne(() => UserModel),
    JoinColumn({ name: 'player2Id' }),
    __metadata("design:type", UserModel)
], TournamentMatchModel.prototype, "player2", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Number)
], TournamentMatchModel.prototype, "winnerId", void 0);
__decorate([
    ManyToOne(() => UserModel),
    JoinColumn({ name: 'winnerId' }),
    __metadata("design:type", UserModel)
], TournamentMatchModel.prototype, "winner", void 0);
__decorate([
    Column({ default: 'pending' }),
    __metadata("design:type", String)
], TournamentMatchModel.prototype, "status", void 0);
__decorate([
    Column({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], TournamentMatchModel.prototype, "startedAt", void 0);
__decorate([
    Column({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], TournamentMatchModel.prototype, "endedAt", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Number)
], TournamentMatchModel.prototype, "player1Score", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Number)
], TournamentMatchModel.prototype, "player2Score", void 0);
TournamentMatchModel = __decorate([
    Entity()
], TournamentMatchModel);
export { TournamentMatchModel };
