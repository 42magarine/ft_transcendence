var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
// Instead of direct import, we'll use a type-only import and function references
import { UserModel } from "./User.Model.js";
let GameModel = class GameModel {
    id;
    Player1;
    Player2;
    Player1Score;
    Player2Score;
    WinnerId;
    CreatedAt;
    EndedAt;
    status;
    isLobbyOpen;
    lobbyParticipants;
    gameAdminId;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], GameModel.prototype, "id", void 0);
__decorate([
    ManyToOne(() => UserModel, (user) => user.gameAsPlayer1),
    JoinColumn({ name: 'player1Id' }),
    __metadata("design:type", Object)
], GameModel.prototype, "Player1", void 0);
__decorate([
    ManyToOne(() => UserModel, (user) => user.gameAsPlayer2),
    JoinColumn({ name: 'player2Id' }),
    __metadata("design:type", Object)
], GameModel.prototype, "Player2", void 0);
__decorate([
    Column(),
    __metadata("design:type", Number)
], GameModel.prototype, "Player1Score", void 0);
__decorate([
    Column(),
    __metadata("design:type", Number)
], GameModel.prototype, "Player2Score", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Number)
], GameModel.prototype, "WinnerId", void 0);
__decorate([
    CreateDateColumn({ type: 'datetime' }),
    __metadata("design:type", Date)
], GameModel.prototype, "CreatedAt", void 0);
__decorate([
    Column({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], GameModel.prototype, "EndedAt", void 0);
__decorate([
    Column({ default: 'pending' }),
    __metadata("design:type", String)
], GameModel.prototype, "status", void 0);
__decorate([
    Column({ default: false }),
    __metadata("design:type", Boolean)
], GameModel.prototype, "isLobbyOpen", void 0);
__decorate([
    ManyToMany(() => UserModel),
    JoinTable(),
    __metadata("design:type", Array)
], GameModel.prototype, "lobbyParticipants", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Number)
], GameModel.prototype, "gameAdminId", void 0);
GameModel = __decorate([
    Entity()
], GameModel);
export { GameModel };
// Import at the end to avoid the circular dependency issue
import "./User.Model.js";
