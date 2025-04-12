/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   data-source.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mleibeng <mleibeng@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/02/15 17:10:21 by mleibeng          #+#    #+#             */
/*   Updated: 2025/04/12 19:08:58 by mleibeng         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { DataSource } from "typeorm";
import { UserModel } from "./models/User.Model.js"
// import { TournamentChatModel, TournamentMatchModel, TournamentModel, TournamentRoundModel, TournamentStatisticsModel } from "./models/tournament.model";
import { GameModel } from "./models/Game.Lobby.Model.js";

export const AppDataSource = new DataSource ({
    type: "better-sqlite3",
    database: 'db.sqlite',
    entities: [
        UserModel,
        GameModel
        // TournamentModel,
        // TournamentMatchModel,
        // TournamentRoundModel,
        // TournamentChatModel,
        // TournamentStatisticsModel,
    ],
    synchronize: true, //set to false for production later!!
    logging: true
})

export const initDataSource = async () => {
    try {
        await AppDataSource.initialize()
    }
    catch (error) {
        console.error('Error', error)
    }
}


// import Database from "better-sqlite3";
// import type { Database as DBType } from "better-sqlite3";

// export const db: DBType = new Database("/app/models/db/userDB.db", { verbose: console.log });

// db.exec(`
//     CREATE TABLE IF NOT EXISTS users (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT NOT NULL,
//         username TEXT NOT NULL UNIQUE
//     );
// `);
