import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class UserModel {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ unique: true })
	email!: string;

	@Column()
	username!: string;

	@Column()
	password!: string;

	@Column()
	displayname!: string;

	@Column({ default: 'user' })
	role!: string;

	@Column({ nullable: true })
	avatar?: string;

	@Column({ nullable: true })
	twoFASecret?: string;

	@Column({ default: false })
	twoFAEnabled?: boolean;

	@ManyToMany(() => UserModel)
	@JoinTable({
		name: "friends",
		joinColumn: { name: "userId", referencedColumnName: "id" },
		inverseJoinColumn: { name: "friendId", referencedColumnName: "id" }
	})
	friends!: UserModel[];

	@Column({ default: false })
	emailVerified!: boolean;

	@Column({ nullable: true })
	resetPasswordToken?: string;

	@Column({ nullable: true })
	resetPasswordExpires?: Date;

	@Column({ nullable: true })
	verificationToken?: string;

	@OneToMany(() => GameModel, (game: any) => game.Player1)
	gameAsPlayer1!: any[];

	@OneToMany(() => GameModel, (game: any) => game.Player2)
	gameAsPlayer2!: any[];
}

// needs some work with relations to game model
@Entity()
export class MatchHistory {
	@PrimaryGeneratedColumn()
	id!: number;

	@ManyToOne(() => GameModel, (game: any) => game.Player1)
	playedGames?: GameModel[]

	@Column()
	wonGames!: number;

	@Column()
	lostGames!: number;
}

import { GameModel } from "./GameModel.js";