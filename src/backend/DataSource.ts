import { DataSource } from "typeorm";
import { UserModel } from "./models/UserModel.js"
import { GameModel } from "./models/GameModel.js";

export const AppDataSource = new DataSource({
    type: "better-sqlite3",
    database: "/app/db.sqlite",
    entities: [
        UserModel,
        GameModel
    ],
    synchronize: true,
    logging: false
});

export const initDataSource = async () => {
    await AppDataSource.initialize();
}
