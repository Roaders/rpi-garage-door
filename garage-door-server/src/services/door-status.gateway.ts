import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GarageDoorService } from '../../../rpi-garage-door/src';
import { DOOR_STATUS_UPDATES, DOOR_IMAGE_UPDATES } from '../../../shared';
import { AuthService } from '../auth/';
import { ImagesService } from './images.service';
import { OnModuleDestroy } from '@nestjs/common';

@WebSocketGateway()
export class DoorStatusGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
    constructor(
        private garageDoorService: GarageDoorService,
        private imagesService: ImagesService,
        private authService: AuthService,
    ) {}

    private clients: { [key: string]: Socket | undefined } = {};
    private _listening = false;

    @WebSocketServer()
    server: Server | undefined;

    public onModuleDestroy() {
        Object.keys(this.clients).forEach((id) => this.clients[id]?.disconnect(true));
    }

    public handleConnection(socket: Socket) {
        const tokenValid = this.authService.validateToken(socket.handshake.query.token);

        if (tokenValid == null) {
            socket.disconnect(true);
            return;
        }

        this.clients[socket.id] = socket;
        this.listenForEvents();
    }

    handleDisconnect(client: Socket) {
        delete this.clients[client.id];

        console.log(`Client ${client.id} disconnected (${Object.keys(this.clients).length})`);
    }

    private async listenForEvents() {
        if (!this._listening) {
            this._listening = true;

            this.imagesService.snapStream.subscribe((image) => {
                this.server?.emit(DOOR_IMAGE_UPDATES, image);
            });

            for await (const event of this.garageDoorService.events) {
                this._listening = true;
                this.server?.emit(DOOR_STATUS_UPDATES, event);
            }
        }
    }
}
