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
    type: "sqlite",
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
