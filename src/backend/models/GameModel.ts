import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
// Instead of direct import, we'll use a type-only import and function references
import { UserModel } from "./UserModel.js";

@Entity("games")
export class GameModel {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => UserModel, (user: any) => user.gameAsPlayer1)
    @JoinColumn({ name: 'player1Id' })
    Player1!: any;

    @ManyToOne(() => UserModel, (user: any) => user.gameAsPlayer2)
    @JoinColumn({ name: 'player2Id' })
    Player2!: any;

    @Column({default: 0})
    Player1Score!: number;

    @Column({default: 0})
    Player2Score!: number;

    @Column({ nullable: true })
    WinnerId?: number;

    @CreateDateColumn({ type: 'datetime' })
    CreatedAt!: Date;

    @Column({ type: 'datetime', nullable: true })
    EndedAt?: Date;

    // @Column({ default: 'pending' })
    // status!: 'pending' | 'cancelled' | 'completed' | 'ongoing' | 'paused';

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
