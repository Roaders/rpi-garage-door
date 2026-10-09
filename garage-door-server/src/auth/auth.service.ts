import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { compareSync } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { IUser, IAuthToken, IRefreshToken, IUserToken } from '../../../shared';
import { randomBytes } from 'crypto';
import { jwtConstants } from './constants';
import { join } from 'path';
import { existsSync, promises } from 'fs';
import { verify } from 'jsonwebtoken';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService, private jwtService: JwtService) {}

    public validateToken(token?: string) {
        if (token == null) {
            console.warn(`AuthService.validateToken: no token supplied`);
            return undefined;
        }

        try {
            return verify(token, jwtConstants.secret);
        } catch (e) {
            console.log(`AuthService.validateToken ${token.substr(-5)}: ERROR: ${e}`);
        }
        return undefined;
    }

    async validateUser(username: string, password: string): Promise<IUser | undefined> {
        const user = await this.usersService.findOne(username);

        if (user && compareSync(password, user.hash)) {
            return { username: user.username };
        }

        return undefined;
    }

    async login(user: IUser): Promise<IAuthToken> {
        const refreshPayload = await this.storeRefreshToken(user);

        return {
            access_token: this.jwtService.sign(user),
            refresh_token: this.jwtService.sign(refreshPayload, { expiresIn: jwtConstants.refreshExpiry }),
        };
    }

    private tokensFileQueue: Promise<unknown> = Promise.resolve();

    /**
     * Logins are queued so concurrent read-modify-writes of the tokens file can't overwrite each other
     */
    private storeRefreshToken(user: IUser): Promise<IRefreshToken> {
        const result = this.tokensFileQueue.then(() => this.readOrCreateRefreshToken(user));
        this.tokensFileQueue = result.catch(() => undefined);
        return result;
    }

    private async readOrCreateRefreshToken(user: IUser): Promise<IRefreshToken> {
        const tokensPath = join(__dirname, '../../../../', 'userTokens.json');
        let tokens: IUserToken[] = [];

        if (existsSync(tokensPath)) {
            console.log(`Loading existing tokens from '${tokensPath}'`);

            tokens = JSON.parse((await promises.readFile(tokensPath)).toString());
            const existingUserToken: IUserToken | undefined = tokens.filter(
                (token) => token.username === user.username,
            )[0];

            if (existingUserToken) {
                console.log(`Returning existing refresh token`);
                return { refresh_token: existingUserToken.refresh_token };
            }
        }

        const refreshToken: IRefreshToken = {
            refresh_token: randomBytes(32).toString('hex'),
        };
        tokens.push({ ...user, ...refreshToken });

        console.log(`Writing tokens file to: '${tokensPath}'`);
        // write to a temp file then rename so readers never see a partially written file
        await promises.writeFile(`${tokensPath}.tmp`, JSON.stringify(tokens, undefined, 4));
        await promises.rename(`${tokensPath}.tmp`, tokensPath);

        return refreshToken;
    }
}
