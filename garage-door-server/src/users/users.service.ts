import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { existsSync, promises } from 'fs';
import chalk from 'chalk';
import { IUserAuth, IUser, IUserToken } from '../../../shared';

@Injectable()
export class UsersService {
    private usersCache: { mtimeMs: number; users: IUserAuth[] } | undefined;

    public async findOne(username: string): Promise<IUserAuth | undefined> {
        const usersPath = join(__dirname, '../../../../', 'users.json');

        if (!existsSync(usersPath)) {
            console.log(chalk.red(`Users file not found. Exiting.`));
            return;
        }

        // only re-read the file when it changes (e.g. after npm run create-user)
        const { mtimeMs } = await promises.stat(usersPath);
        if (this.usersCache?.mtimeMs !== mtimeMs) {
            console.log(`Loading users from '${usersPath}'`);

            const users: IUserAuth[] = JSON.parse((await promises.readFile(usersPath)).toString());
            this.usersCache = { mtimeMs, users };
        }

        return this.usersCache.users.filter((user) => user.username === username)[0];
    }

    public async findFromRefreshToken(refreshToken: string): Promise<IUser | undefined> {
        const tokensPath = join(__dirname, '../../../../', 'userTokens.json');

        let tokens: IUserToken[];

        if (existsSync(tokensPath)) {
            tokens = JSON.parse((await promises.readFile(tokensPath)).toString());
        } else {
            console.log(chalk.red(`findFromRefreshToken: Tokens file not found. Exiting.`));
            return;
        }

        const user: IUser | undefined = tokens
            .filter((token) => token.refresh_token === refreshToken)
            .map((token) => ({ username: token.username }))[0];

        return user;
    }
}
