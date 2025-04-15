var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
let UserModel = class UserModel {
    id;
    email;
    username;
    password;
    displayname;
    role;
    twoFASecret;
    twoFAEnabled;
    refreshToken;
    friends;
    gameAsPlayer1;
    gameAsPlayer2;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], UserModel.prototype, "id", void 0);
__decorate([
    Column({ unique: true }),
    __metadata("design:type", String)
], UserModel.prototype, "email", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], UserModel.prototype, "username", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], UserModel.prototype, "password", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], UserModel.prototype, "displayname", void 0);
__decorate([
    Column({ default: 'user' }),
    __metadata("design:type", String)
], UserModel.prototype, "role", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], UserModel.prototype, "twoFASecret", void 0);
__decorate([
    Column({ default: false }),
    __metadata("design:type", Boolean)
], UserModel.prototype, "twoFAEnabled", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], UserModel.prototype, "refreshToken", void 0);
__decorate([
    ManyToMany(() => UserModel),
    JoinTable(),
    __metadata("design:type", Array)
], UserModel.prototype, "friends", void 0);
__decorate([
    OneToMany(() => GameModel, (game) => game.Player1),
    __metadata("design:type", Array)
], UserModel.prototype, "gameAsPlayer1", void 0);
__decorate([
    OneToMany(() => GameModel, (game) => game.Player2),
    __metadata("design:type", Array)
], UserModel.prototype, "gameAsPlayer2", void 0);
UserModel = __decorate([
    Entity()
], UserModel);
export { UserModel };
import { GameModel } from "./Game.Lobby.Model.js";
