import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, TableInheritance, ManyToMany, JoinTable, OneToMany, ChildEntity } from "typeorm";
import { ITournamentRound } from "../../interfaces/interfaces.js";
import { JsonColumnTransformer } from "../transformers/JsonTransformer.js";

@Entity()
export class UserModel {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    email!: string;

    @Column()
    username!: string;

    @Column()
    name!: string;

    @Column()
    password!: string;

    @Column({ default: false })
    online!: boolean;

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

    @ManyToOne(() => UserModel, (user) => user.matchAsPlayer2, { nullable: true })
    @JoinColumn({ name: 'player2Id' })
    player2?: UserModel | null;

    @Column({ default: 0 })
    player1Score!: number;

    @Column({ default: 0 })
    player2Score!: number;

    @Column({ nullable: true })
    winnerId?: number;

    @ManyToOne(() => UserModel)
    @JoinColumn()
    winner?: UserModel;

    @Column({ default: 'pending' })
    status!: 'pending' | 'cancelled' | 'completed' | 'ongoing';

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
    lobbyParticipants!: UserModel[];

    @Column({ nullable: true })
    gameAdminId?: number;

    @Column({ default: 2 })
    maxPlayers!: number;

    @Column({ default: '' })
    lobbyName!: string;

    @Column('simple-json', { nullable: true })
    readyStatusMap?: Record<number, boolean>;

    @Column("simple-array", { nullable: true })
    invitedUserIds?: number[];

    @ManyToOne(() => TournamentModel, tournament => tournament.matches, { nullable: true })
    @JoinColumn({ name: 'tournamentId' })
    tournament?: TournamentModel | null;

    @Column({ nullable: true })
    tournamentId?: number;

}


@Entity()
export class TournamentModel
{
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({unique: true})
    lobbyId!: string;

    @Column()
    name!:string

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'creatorId'})
    creator!: UserModel;

    @Column()
    maxPlayers!: number;

    @Column({ default: 'pending'})
    status!: 'pending' | 'ongoing' | 'completed' | 'cancelled';

     @CreateDateColumn({ type: 'datetime' })
    createdAt!: Date;

    @Column({ type: 'datetime', nullable: true })
    startedAt?: Date;

    @Column({ type: 'datetime', nullable: true })
    endedAt?: Date;

    @ManyToMany(() => UserModel)
    @JoinTable({
        name: "tournament_participants"
    })
    lobbyParticipants!: UserModel[];

    @OneToMany(() => MatchModel, (match) => match.tournament)
    matches!: MatchModel[];

    @Column({ type: 'text', transformer: new JsonColumnTransformer() })
    playerScores?: { [userId: number]: number }; // Stores points for each player

    @Column({ default: 1 })
    currentRound!: number;

    @Column({type: 'text', transformer: new JsonColumnTransformer() })
    matchSchedule?: ITournamentRound[]; // Array of rounds, each containing array of matches for that round

    @ManyToOne(() => UserModel, { nullable: true })
    @JoinColumn({ name: 'winnerUserId' })
    winner?: UserModel; // The winner of the tournament

    @Column({name: 'winnerUserId', nullable: true })
    winnerId!: number | null; // Store the ID of the winner
}