import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class UserModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({unique: true})
  email!: string

  @Column()
  username!: string

  @Column()
  password!: string

  @Column()
  displayname!: string

  @Column({default: 'user'})
  role!: string

  @Column({nullable: true})
  twoFASecret?: string

  @Column({default: false})
  twoFAEnabled?: boolean

  @Column({nullable: true})
  refreshToken?: string

  @ManyToMany(() => UserModel)
  @JoinTable()
  friends!: UserModel[];

  @OneToMany(() => GameModel, (game: any) => game.Player1)
  gameAsPlayer1!: any[]

  @OneToMany(() => GameModel, (game: any) => game.Player2)
  gameAsPlayer2!: any[]
}

import { GameModel } from "./Game.Lobby.Model.js";