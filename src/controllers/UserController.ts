import { UserModel } from "../models/UserModel.js";

export class UserController {
    static instance: UserController;

    public static getInstance(): UserController {
        if (!UserController.instance) {
            UserController.instance = new UserController(new UserModel());
        }
        return UserController.instance;
    }

    constructor(private userModel: UserModel) { }

    public createUser(user: { name: string, username: string }) {
        return this.userModel.create(user);
    }

    public readAllUser() {
        return this.userModel.readAll();
    }

    public readOneUser(id: number) {
        return this.userModel.readOne(id);
    }

    public updateUser(user: { id: number, name: string, username: string }) {
        return this.userModel.update(user);
    }

    public deleteUser(id: number) {
        return this.userModel.delete(id);
    }
}
