// import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
// import { UserModel } from "./User.Model.js";

// @Entity()
// export class GameModel {
//     @PrimaryGeneratedColumn()
//     id!:number;

//     @ManyToOne(() => UserModel, (user) => user.gameAsPlayer1)
//     @JoinColumn({name: 'player1Id'})
//     Player1!:UserModel;

//     @ManyToOne(() => UserModel, (user => user.gameAsPlayer2))
//     @JoinColumn({name: 'player2Id'})
//     Player2!:UserModel;

//     @Column()
//     Player1Score!: number;

//     @Column()
//     Player2Score!: number;

//     @Column({nullable: true})
//     WinnerId?: number

//     @CreateDateColumn({type: 'datetime'})
//     CreatedAt!: Date;

//     @Column({type: 'datetime', nullable: true})
//     EndedAt?: Date;

//     @Column({default: 'pending'})
//     status!: 'pending' | 'cancelled' | 'completed' | 'ongoing' | 'paused'

//     @Column({default: false})
//     isLobbyOpen!: boolean;

//     @ManyToMany(() => UserModel)
//     lobbyParticipants!: UserModel[];

//     @Column({nullable: true})
//     gameAdminId?: number;
// }