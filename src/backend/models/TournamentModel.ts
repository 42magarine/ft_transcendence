import { CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, JoinColumn, ManyToOne, ChildEntity } from "typeorm";
import { UserModel } from "./UserModel.js";
import { MatchModel } from "./MatchModel.js";

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

    // waiting for all rounds to finish
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

@ChildEntity()
export class TournamentMatchModel extends MatchModel {
    @ManyToOne(() => TournamentRoundModel, (round) => round.matches)
    @JoinColumn({ name: 'roundId' })
    round!: TournamentModel;
}
