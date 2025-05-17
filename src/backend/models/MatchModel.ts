import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, TableInheritance, ManyToMany, JoinTable, OneToMany, ChildEntity } from "typeorm";

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

    @OneToMany("MatchModel", (match: any) => match.player1)
    matchAsPlayer1!: any[];

    @OneToMany("MatchModel", (match: any) => match.player2)
    matchAsPlayer2!: any[];
}

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class MatchModel {
    @PrimaryGeneratedColumn()
    id!: number

    @ManyToOne(() => UserModel, (user) => user.matchAsPlayer1)
    @JoinColumn({ name: 'player1Id' })
    player1!: typeof UserModel.prototype;

    @ManyToOne(() => UserModel, (user) => user.matchAsPlayer2)
    @JoinColumn({ name: 'player2Id' })
    player2!: typeof UserModel.prototype;

    @Column({ default: 0 })
    player1Score!: number;

    @Column({ default: 0 })
    player2Score!: number;

    @Column({ nullable: true })
    winnerId?: number;

    @ManyToOne(() => UserModel)
    @JoinColumn()
    winner?: typeof UserModel.prototype

    @Column({ default: 'pending' })
    status!: 'pending' | 'cancelled' | 'completed' | 'ongoing' | 'paused';

    @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;

    @Column({ type: 'datetime', nullable: true })
    startedAt?: Date;

    @Column({ type: 'datetime', nullable: true })
    endedAt?: Date;
}

@ChildEntity("games")
export class GameModel extends MatchModel {

    @Column({ default: false })
    isLobbyOpen!: boolean;

    @ManyToMany(() => UserModel)
    @JoinTable()
    lobbyParticipants!: typeof UserModel.prototype[];

    @Column({ nullable: true })
    gameAdminId?: number;
}
