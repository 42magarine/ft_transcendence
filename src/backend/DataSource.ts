import { DataSource } from "typeorm";
import { UserModel } from "./models/MatchModel.js";
import { MatchModel } from "./models/MatchModel.js";

export const AppDataSource = new DataSource({
    type: "better-sqlite3",
    database: "./db.sqlite",
    entities: [
        UserModel,
        MatchModel,
    ],
    synchronize: true,
    logging: false
});

export const initDataSource = async () => {
    await AppDataSource.initialize();
}
