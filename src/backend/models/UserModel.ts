import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

	@OneToMany(() => MatchModel, (match: any) => match.player1)
	matchAsPlayer1!: any[];

	@OneToMany(() => MatchModel, (match: any) => match.player2)
	matchAsPlayer2!: any[];
}

@Entity()
export class MatchHistory {
	@PrimaryGeneratedColumn()
	id!: number;

	@ManyToOne(() => UserModel)
	@JoinColumn({name: 'userId'})
	user!: UserModel

	@OneToMany(() => MatchModel, (match) => match.player1 || match.player2)
	@JoinTable()
	playedGames!: MatchModel[]

	@Column({default: 0})
	wonGames!: number;

	@Column({default: 0})
	lostGames!: number;
}

import { MatchModel } from "./MatchModel.js";