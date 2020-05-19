import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';
import { IUser, IRefreshToken } from '../../../shared';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ExchangeTokenStrategy extends PassportStrategy(Strategy, 'exchange-token') {
    constructor(private userService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        });
    }

    async validate(payload: IRefreshToken): Promise<IUser | undefined> {
        console.log(`ExchangeTokenStrategy Validate: ${JSON.stringify(payload)}`);

        const user = await this.userService.findFromRefreshToken(payload.refresh_token);

        return user ? { username: user.username } : undefined;
    }
}
