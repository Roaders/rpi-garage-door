import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { IUser } from '../../../../shared';

const maxFailedAttempts = 5;
const failedAttemptWindowMs = 15 * 60 * 1000;

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    private failedAttempts = new Map<string, { count: number; firstFailure: number }>();

    constructor(private authService: AuthService) {
        super({ passReqToCallback: true });
    }

    async validate(req: Request, username: string, password: string): Promise<IUser> {
        const now = Date.now();
        this.failedAttempts.forEach((attempt, ip) => {
            if (now - attempt.firstFailure > failedAttemptWindowMs) {
                this.failedAttempts.delete(ip);
            }
        });

        const previous = this.failedAttempts.get(req.ip);
        if (previous != null && previous.count >= maxFailedAttempts) {
            throw new HttpException('Too many failed login attempts. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
        }

        const user = await this.authService.validateUser(username, password);

        if (!user) {
            this.failedAttempts.set(req.ip, {
                count: (previous?.count ?? 0) + 1,
                firstFailure: previous?.firstFailure ?? now,
            });
            throw new UnauthorizedException();
        }

        this.failedAttempts.delete(req.ip);
        return user;
    }
}
