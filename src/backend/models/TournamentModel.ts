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

  @Column({ type: 'simple-json', nullable: true })
  bracket?: {
    rounds: {
      roundNumber: number;
      matches: {
        matchId: number;
        player1Id?: number;
        player2Id?: number;
        winnerId?: number;
      }[];
    }[];
  };

  @Column({ default: 'registration' })
  tournamentPhase!: 'registration' | 'in_progress' | 'completed';
}
