import { ChildEntity, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, OneToMany } from "typeorm";
// Instead of direct import, we'll use a type-only import and function references
// import { UserModel } from "./common.js";
// import { MatchModel } from "./common.js"

// @Entity()
// export class MatchHistory {
// 	@PrimaryGeneratedColumn()
// 	id!: number;

// 	@ManyToOne(() => UserModel)
// 	@JoinColumn({name: 'userId'})
// 	user!: UserModel

// 	@OneToMany(() => MatchModel, (match) => match.player1 || match.player2)
// 	@JoinTable()
// 	playedGames!: MatchModel[]

// 	@Column({default: 0})
// 	wonGames!: number;

// 	@Column({default: 0})
// 	lostGames!: number;
// }