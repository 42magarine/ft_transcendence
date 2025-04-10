import { db } from "./Database.js";

export class UserModel {
    static instance: UserModel;

    public static getInstance(): UserModel {
        if (!UserModel.instance) {
            UserModel.instance = new UserModel();
        }
        return UserModel.instance;
    }

    create(user: { name: string; username: string }) {
        const stmt = db.prepare("INSERT INTO users (name, username) VALUES (?, ?)");
        const result = stmt.run(user.name, user.username);
        return { id: result.lastInsertRowid };
    }

    readAll() {
        const stmt = db.prepare("SELECT * FROM users");
        const result = stmt.all();
        return result;
    }

    readOne(id: number) {
        const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
        const result = stmt.get(id);
        return result;
    }

    update(user: { id: number; name: string; username: string }) {
        const stmt = db.prepare("UPDATE users SET name = ?, username = ? WHERE id = ?");
        const result = stmt.run(user.name, user.username, user.id);
        return { updated: result.changes };
    }

    delete(id: number) {
        const stmt = db.prepare("DELETE FROM users WHERE id = ?");
        const result = stmt.run(id);
        return { deleted: result.changes };
    }
};
