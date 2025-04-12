import Database from "better-sqlite3";
import type { Database as DBType } from "better-sqlite3";

export const db: DBType = new Database("/app/models/db/userDB.db", { verbose: console.log });

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE
    );
`);

// Eine Datenbank mit 3 Tabellen: User, Game, Tournement
// Anfragen über ORM (Models)
// Service
// Controller: User, Game, Tournement
// API
// Frontend

// Game-Logik separat
