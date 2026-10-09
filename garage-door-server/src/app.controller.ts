import {
    Controller,
    Get,
    UseGuards,
    Request as RequestParam,
    Post,
    Put,
    Query,
    Body,
    BadRequestException,
} from '@nestjs/common';
import { LocalAuthGuard, AuthService, JwtAuthGuard, ExchangeTokenAuthGuard } from './auth';
import { GarageDoorService } from '../../rpi-garage-door/src';
import { ImagesService } from './services';
import { IGarageDoorStatus, UPDATE_DOOR_STATUS } from '../../shared';

function parseDoorStatus(body?: Partial<IGarageDoorStatus>): IGarageDoorStatus<UPDATE_DOOR_STATUS> {
    const status = body?.status;
    if (status !== 'OPEN' && status !== 'CLOSED') {
        throw new BadRequestException(`status must be 'OPEN' or 'CLOSED'`);
    }
    return { status };
}

@Controller('api')
export class AppController {
    constructor(
        private authService: AuthService,
        private garageDoorService: GarageDoorService,
        private imagesService: ImagesService,
    ) {}

    @Get('/garage/image')
    @UseGuards(JwtAuthGuard)
    getImages(@Query('maxCount') maxCount?: string, @Query('before') before?: string) {
        return this.imagesService.getImages(
            maxCount != null ? parseInt(maxCount) : undefined,
            before != null ? parseInt(before) : undefined,
        );
    }

    @Get('/garage/image/newImage')
    @UseGuards(JwtAuthGuard)
    getNewImage() {
        return this.imagesService.newImage();
    }

    @Get('/garage/door')
    @UseGuards(JwtAuthGuard)
    getDoorStatus() {
        return this.garageDoorService.getState();
    }

    @Put('/garage/door')
    @UseGuards(JwtAuthGuard)
    controlDoor(@Body() body?: Partial<IGarageDoorStatus>) {
        return this.garageDoorService.setState(parseDoorStatus(body));
    }

    @Put('login/door')
    @UseGuards(LocalAuthGuard)
    loginControlDoor(@Body() body?: Partial<IGarageDoorStatus>) {
        return this.garageDoorService.setState(parseDoorStatus(body));
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@RequestParam() req: any) {
        return this.authService.login(req.user);
    }

    @UseGuards(ExchangeTokenAuthGuard)
    @Get('exchangeToken')
    async exchangeToken(@RequestParam() req: any) {
        return this.authService.login(req.user);
    }
}
