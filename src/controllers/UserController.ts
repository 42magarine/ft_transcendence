import { db } from "../models/Database.js";

export class UserController {
    static instance: UserController;

    public static getInstance(): UserController {
        if (!UserController.instance) {
            UserController.instance = new UserController();
        }
        return UserController.instance;
    }

    public createUser(user: { name: string, username: string }) {
        const stmt = db.prepare("INSERT INTO users (name, username) VALUES (?, ?)");
        const result = stmt.run(user.name, user.username);
        return { id: result.lastInsertRowid };
    }

    public readAllUser() {
        const stmt = db.prepare("SELECT * FROM users");
        return stmt.all();
    }

    public readOneUser(id: number) {
        const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
        return stmt.get(id);
    }

    public updateUser(user: { id: number, name: string, username: string }) {
        const stmt = db.prepare("UPDATE users SET name = ?, username = ? WHERE id = ?");
        const result = stmt.run(user.name, user.username, user.id);
        return { updated: result.changes };
    }

    public deleteUser(id: number) {
        const stmt = db.prepare("DELETE FROM users WHERE id = ?");
        const result = stmt.run(id);
        return { deleted: result.changes };
    }
}
