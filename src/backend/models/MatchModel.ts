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

    // @OneToMany("MatchModel", (match: any) => match.player1)
    // matchAsPlayer1!: any[];

    // @OneToMany("MatchModel", (match: any) => match.player2)
    // matchAsPlayer2!: any[];

    @OneToMany(() => MatchModel, (match) => match.player1)
    matchAsPlayer1!: MatchModel[];

    @OneToMany(() => MatchModel, (match) => match.player2)
    matchAsPlayer2!: MatchModel[];
}

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class MatchModel {
    @PrimaryGeneratedColumn()
    matchModelId!: number

    @Column({ nullable: true })
    lobbyId!: string

    @ManyToOne(() => UserModel, (user) => user.matchAsPlayer1)
    @JoinColumn({ name: 'player1Id' })
    player1!: UserModel;

    @ManyToOne(() => UserModel, (user) => user.matchAsPlayer2, { nullable: true})
    @JoinColumn({ name: 'player2Id'})
    player2?: UserModel | null;

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

    @Column({ default: false })
    isLobbyOpen!: boolean;

    @ManyToMany(() => UserModel)
    @JoinTable()
    lobbyParticipants!: typeof UserModel.prototype[];

    @Column({ nullable: true })
    gameAdminId?: number;

    @Column({ default: 2 })
    maxPlayers!: number;

    @Column({ default: '' })
    lobbyName!: string;

    @Column({ default: false })
    hasPassword!: boolean;

    @Column({ nullable: true })
    passwordHash?: string;

    @Column('simple-json', { nullable: true })
    readyStatusMap?: Record<number, boolean>;

    @Column("simple-array", { nullable: true })
    invitedUserIds?: number[];
}

// @ChildEntity("games")
// export class GameModel extends MatchModel {

//     @Column({ default: false })
//     isLobbyOpen!: boolean;

//     @ManyToMany(() => UserModel)
//     @JoinTable()
//     lobbyParticipants!: typeof UserModel.prototype[];

//     @Column({ nullable: true })
//     gameAdminId?: number;

//     @Column({ default: 2 })
//     maxPlayers!: number;

//     @Column({ default: '' })
//     lobbyName!: string;

//     @Column({ default: false })
//     hasPassword!: boolean;

//     @Column({ nullable: true })
//     passwordHash?: string;

//     @Column('simple-json', { nullable: true })
//     readyStatusMap?: Record<number, boolean>;

//     @Column("simple-array", { nullable: true })
//     invitedUserIds?: number[];
// }



// @ChildEntity("tournaments")
// export class TournamentModel extends MatchModel {
//   @Column({ default: 8 })
//   maxParticipants!: number;

//   @ManyToMany(() => UserModel)
//   @JoinTable()
//   participants!: UserModel[];

//   @ManyToMany(() => GameModel)
//   @JoinTable()
//   matches!: GameModel[];

//   @Column({ default: 'registration' })
//   tournamentPhase!: 'registration' | 'in_progress' | 'completed';
// }


// @Entity('tournament_matches')
// export class TournamentMatchModel {
//     @PrimaryGeneratedColumn()
//     id!: number;

//     @Column()
//     tournamentId!: number;

//     @ManyToOne(() => TournamentModel, tournament => tournament.matches)
//     @JoinColumn({ name: 'tournamentId' })
//     tournament!: TournamentModel;

//     @ManyToOne(() => UserModel)
//     @JoinColumn({ name: 'player1Id' })
//     player1!: UserModel;

//     @Column()
//     player1Id!: number;

//     @ManyToOne(() => UserModel)
//     @JoinColumn({ name: 'player2Id' })
//     player2!: UserModel;

//     @Column()
//     player2Id!: number;

//     @Column({ default: 0 })
//     player1Score!: number;

//     @Column({ default: 0 })
//     player2Score!: number;

//     @ManyToOne(() => UserModel, { nullable: true })
//     @JoinColumn({ name: 'winnerId' })
//     winner!: UserModel;

//     @Column({ nullable: true })
//     winnerId!: number;

//     @Column({ default: 'pending' })
//     status!: 'pending' | 'ongoing' | 'paused' | 'completed' | 'cancelled';

//     @Column()
//     matchNumber!: number;

//     @CreateDateColumn()
//     createdAt!: Date;

//     @Column({ nullable: true, type: 'timestamp' })
//     startedAt!: Date;

//     @Column({ nullable: true, type: 'timestamp' })
//     endedAt!: Date;
// }
