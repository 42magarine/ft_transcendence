import { CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, JoinColumn, ManyToOne, ChildEntity } from "typeorm";
import { UserModel } from "./UserModel.js";
import { MatchModel } from "./MatchModel.js";
import { GameModel } from "./GameModel.js";

@ChildEntity("tournaments")
export class TournamentModel extends MatchModel {
  @Column({ default: 8 })
  maxParticipants!: number;

  @ManyToMany(() => UserModel)
  @JoinTable()
  participants!: UserModel[];

  @ManyToMany(() => GameModel)
  @JoinTable()
  matches!: GameModel[];

  @Column({ default: 'registration' })
  tournamentPhase!: 'registration' | 'in_progress' | 'completed';
}


@Entity('tournament_matches')
export class TournamentMatchModel {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    tournamentId!: number;

    @ManyToOne(() => TournamentModel, tournament => tournament.matches)
    @JoinColumn({ name: 'tournamentId' })
    tournament!: TournamentModel;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'player1Id' })
    player1!: UserModel;

    @Column()
    player1Id!: number;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'player2Id' })
    player2!: UserModel;

    @Column()
    player2Id!: number;

    @Column({ default: 0 })
    player1Score!: number;

    @Column({ default: 0 })
    player2Score!: number;

    @ManyToOne(() => UserModel, { nullable: true })
    @JoinColumn({ name: 'winnerId' })
    winner!: UserModel;

    @Column({ nullable: true })
    winnerId!: number;

    @Column({ default: 'pending' })
    status!: 'pending' | 'ongoing' | 'paused' | 'completed' | 'cancelled';

    @Column()
    matchNumber!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @Column({ nullable: true, type: 'timestamp' })
    startedAt!: Date;

    @Column({ nullable: true, type: 'timestamp' })
    endedAt!: Date;
}