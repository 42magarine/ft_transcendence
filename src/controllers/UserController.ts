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
        const user = this.userModel.readAll();
        return user;
        // if (user) {
        //     return user;
        // }
        // else {
        //     return notify("Digga User nicht da Bruda!!!");
        // }
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
