import { createWriteStream, unlink } from "fs";
import { mkdir } from "fs/promises";
import { join, extname } from "path";
import { v4 as uuidv4 } from "uuid";
import { access } from 'fs';
import { constants } from 'fs';

const UPLOAD_DIR = join(process.cwd(), "uploads", "avatars");

export interface FileUploadResult {
    filename: string;
    path: string;
    publicPath: string;
}

export async function saveAvatar(file: any): Promise<FileUploadResult> {
    await mkdir(UPLOAD_DIR, { recursive: true });

    const extension = extname(file.filename).toLowerCase();

    if (extension !== ".jpg" && extension !== ".jpeg" && extension !== ".png") {
        throw new Error("Only JPG and PNG files are allowed");
    }

    const filename = `${uuidv4()}${extension}`;
    const filepath = join(UPLOAD_DIR, filename);

    return new Promise((resolve, reject) => {
        const writeStream = createWriteStream(filepath);

        writeStream.on("error", (err) => {
            reject(err);
        });

        writeStream.on("finish", () => {
            resolve({
                filename,
                path: filepath,
                publicPath: `/uploads/avatars/${filename}`
            });
        });

        file.file.pipe(writeStream);
    });
}

/**
 * Deletes an avatar file from the file system
 * @param avatarPath The public path of the avatar (e.g. /uploads/avatars/filename.jpg)
 * @returns A promise that resolves when the file is deleted
 */

export async function deleteAvatar(avatarPath: string): Promise<boolean> {
    if (!avatarPath) {
        return false;
    }

    const filename = avatarPath.split('/').pop();
    if (!filename) {
        return false;
    }

    const filepath = join(UPLOAD_DIR, filename);

    return new Promise((resolve) => {
        access(filepath, constants.F_OK, (err) =>
        {
            if (err)
            {
                return resolve(false);
            }

            unlink(filepath, (err) =>
            {
                if (err)
                {
                    console.error(`❌ Failed to delete file ${filepath}:`, err);
                    return resolve(false);
                }

                resolve(true);
            });
        });
    });
}
