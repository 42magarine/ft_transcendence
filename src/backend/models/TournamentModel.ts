import { CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, JoinColumn, ManyToOne } from "typeorm";
import { UserModel } from "./UserModel.js";

@Entity()
export class TournamentModel {
    @PrimaryGeneratedColumn()
    utid!: number;

    @Column({ nullable: true })
    tournamendAdminId?: number;

    @ManyToMany(() => UserModel)
    @JoinTable()
    participants!: UserModel[];

    @Column({ default: 4 })
    minPlayers!: number;

    @Column({ default: 8 })
    maxPlayers!: number;

    @OneToMany(() => TournamentRoundModel, (round) => round.tournament)
    rounds!: TournamentRoundModel[];

    @Column({ default: 'pending' })
    status!: 'pending' | 'cancelled' | 'completed' | 'ongoing' | 'paused';

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;

    @Column({ type: 'datetime', nullable: true })
    startedAt?: Date;

    @Column({ type: 'datetime', nullable: true })
    endedAt?: Date;
}

@Entity()
export class TournamentRoundModel {
    @PrimaryGeneratedColumn()
    urid!: number;

    @Column()
    roundNumber!: number;

    @ManyToOne(() => TournamentModel, (tournament) => tournament.rounds)
    @JoinColumn({ name: 'tournamentId' })
    tournament!: TournamentModel;

    @OneToMany(() => TournamentMatchModel, (match) => match.round)
    matches!: TournamentMatchModel[];
}

@Entity()
export class TournamentMatchModel {
    @PrimaryGeneratedColumn()
    umid!: number;

    @ManyToOne(() => TournamentRoundModel, (round) => round.matches)
    @JoinColumn({ name: 'roundId' })
    round!: TournamentModel;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'player1Id' })
    player1!: UserModel;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'player2Id' })
    player2!: UserModel;

    @Column({ nullable: true })
    winnerId!: number;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'winnerId' })
    winner!: UserModel;

    @Column({ default: 'pending' })
    status!: 'pending' | 'cancelled' | 'completed' | 'ongoing' | 'paused';

    @Column({ type: 'datetime', nullable: true })
    startedAt?: Date;

    @Column({ type: 'datetime', nullable: true })
    endedAt?: Date;

    @Column({ nullable: true })
    player1Score?: number;

    @Column({ nullable: true })
    player2Score?: number;
}
