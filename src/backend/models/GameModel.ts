import { ChildEntity, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
// Instead of direct import, we'll use a type-only import and function references
import { UserModel } from "./UserModel.js";

@ChildEntity("games")
export class GameModel extends MatchModel {

    @Column({ default: false })
    isLobbyOpen!: boolean;

    @ManyToMany(() => UserModel)
    @JoinTable()
    lobbyParticipants!: UserModel[];

    @Column({ nullable: true })
    gameAdminId?: number;
}

// Import at the end to avoid the circular dependency issue
import "./UserModel.js";
import {MatchModel} from "./MatchModel.js"
