export declare class UserModel {
    id: number;
    email: string;
    username: string;
    password: string;
    displayname: string;
    role: string;
    twoFASecret?: string;
    twoFAEnabled?: boolean;
    refreshToken?: string;
    friends: UserModel[];
    gameAsPlayer1: any[];
    gameAsPlayer2: any[];
}
