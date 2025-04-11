import { CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, Column } from "typeorm";


@Entity()
export class TournamentModel {
    @PrimaryGeneratedColumn()
    utid!: number;

    @CreateDateColumn({type: 'datetime'})
    createdAt!: Date;

    @Column({type: 'datetime', nullable: true})
    startedAt?: Date;

    @Column({type: 'datetime', nullable: true})
    endedAt?: Date;
}