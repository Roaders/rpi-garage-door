import { Controller, Get, UseGuards, Request, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { LocalAuthGuard, AuthService } from './auth';
import { JwtAuthGuard } from './auth/jwt.auth-guard';
import { ExchangeTokenAuthGuard } from './auth/exchange-token.auth-guard';

@Controller('api')
export class AppController {
    constructor(private readonly appService: AppService, private authService: AuthService) {}

    @Get('time')
    @UseGuards(JwtAuthGuard)
    getTime() {
        return this.appService.getTime();
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req: any) {
        return this.authService.login(req.user);
    }

    @UseGuards(ExchangeTokenAuthGuard)
    @Get('exchangeToken')
    async exchangeToken(@Request() req: any) {
        console.log(`exchangeToken endpoint: ${req.user.username}`);
        return this.authService.login(req.user);
    }
}
