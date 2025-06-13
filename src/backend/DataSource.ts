import { DataSource } from "typeorm";
import { UserModel } from "./models/MatchModel.js";
import { MatchModel } from "./models/MatchModel.js";
import { TournamentModel } from "./models/MatchModel.js";

export const AppDataSource = new DataSource({
    type: "better-sqlite3",
    database: "./db.sqlite",
    entities: [
        UserModel,
        MatchModel,
        TournamentModel
    ],
    synchronize: true,
    logging: false
});

export const initDataSource = async () => {
    try {
        await AppDataSource.initialize();
    }
    catch (error) {
        console.error("Failed to initialize data source:", error);
        throw error;
    }
};
