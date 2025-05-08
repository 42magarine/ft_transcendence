import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, TableInheritance } from "typeorm";
import { UserModel } from "./UserModel.js";


@Entity()
@TableInheritance({ column: {type: "varchar", name: "type"}})
export class MatchModel
{
    @PrimaryGeneratedColumn()
    id!: number

    @ManyToOne(() => UserModel, (user: any) => user.gameAsPlayer1)
    @JoinColumn({ name: 'player1Id' })
    player1!: any;

    @ManyToOne(() => UserModel, (user: any) => user.gameAsPlayer2)
    @JoinColumn({ name: 'player2Id' })
    player2!: any;

    @Column({default: 0})
    player1Score!: number;

    @Column({default: 0})
    player2Score!: number;

    @Column({ nullable: true })
    winnerId?: number;

    @ManyToOne(() => UserModel)
    @JoinColumn()
    winner?: UserModel

    @Column({ default: 'pending' })
    status!: 'pending' | 'cancelled' | 'completed' | 'ongoing' | 'paused';

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;

    @Column({ type: 'datetime', nullable: true })
    startedAt?: Date;

    @Column({ type: 'datetime', nullable: true })
    endedAt?: Date;

}
