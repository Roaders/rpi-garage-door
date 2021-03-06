import io from 'socket.io-client';
import { IAuthToken, ILoggingTarget } from './contracts';
import { Subject, interval, Subscription } from 'rxjs';
import { take, mergeMap } from 'rxjs/operators';
import { printError } from './helpers';

const initialReconnectDelay = 500;
const maxReconnectDelay = 60000;

export class SocketFactory {
    constructor(private logger: ILoggingTarget, private baseUrl: string) {}

    private _socket: SocketIOClient.Socket | undefined;
    private _socketSubject = new Subject<SocketIOClient.Socket>();
    private _token: IAuthToken | undefined;

    private _reconnectSubscription: Subscription | undefined;
    private _reconnectTimeout: number = initialReconnectDelay;

    public get socketStream() {
        return this._socketSubject.asObservable();
    }

    public close() {
        if (this._socket != null) {
            this._socket.close();
            this._reconnectSubscription?.unsubscribe();
        }
    }

    public createSocket(tokenFactory: () => Promise<IAuthToken>, token?: IAuthToken) {
        if (token == null) {
            return this.attemptConnection(tokenFactory, true);
        }

        if (this._token?.access_token === token.access_token && this._token?.refresh_token === token.refresh_token) {
            return;
        }
        this._token = token;

        if (this._socket != null) {
            this._socket.close();
            this.resetReconnection();
        }

        try {
            const socket = io(`${this.baseUrl}?token=${token.access_token}`, { reconnection: false });
            this._socket = socket;

            socket.on('connect', () => {
                this.logger.log(`SocketFactory: SOCKET CONNECTED`);
                this.resetReconnection();
            });

            socket.on('reconnect', () => this.logger.log(`SocketFactory: reconnect`));
            socket.on('reconnect_failed', () => this.logger.log(`SocketFactory: reconnect_failed`));
            socket.on('reconnect_error', () => this.logger.log(`SocketFactory: reconnect_error`));
            socket.on('reconnecting', (count: number) => this.logger.log(`SocketFactory: reconnecting ${count}`));
            socket.on('error', (error: any) => this.logger.log(`SocketFactory: Error from stream: ${error}`));

            socket.on('connect_error', () => {
                this.logger.log(`SocketFactory: connect_error`);
                this._socket?.close();
                this.attemptConnection(tokenFactory);
            });

            socket.on('disconnect', () => {
                this.logger.log(`GarageDoorHttpService: disconnect`);
                this._socket?.close();
                this.attemptConnection(tokenFactory);
            });
        } catch (e) {
            this.logger.log(`SocketFactory: Error setting up stream: ${e}`);
        }

        this._socketSubject.next(this._socket);
    }

    /**
     * We need custom reconnect logic rather than relying on socket io reconnection
     * This is because most likely our token will have changed when we need to reconnect
     * because of this we exchange our existing token for a new one before trying to reconnect to socket.
     * @param token
     * @param baseUrl
     * @param tokenFactory
     */
    private attemptConnection(tokenFactory: () => Promise<IAuthToken>, immediate = false) {
        const connectDelay = immediate ? 0 : this._reconnectTimeout;
        this.logger.log(`SocketFactory attemptConnection delay: ${connectDelay}`);

        this._reconnectSubscription = interval(connectDelay)
            .pipe(
                take(1),
                mergeMap(() => tokenFactory()),
            )
            .subscribe(
                (refreshedToken) => {
                    this.logger.log(`GarageDoorHttpService: attempting connection`);
                    this.createSocket(tokenFactory, refreshedToken);
                },
                (error) => {
                    this.logger.log(`GarageDoorHttpService: connection failed: ${printError(error)}`);
                    this._reconnectTimeout = Math.min(maxReconnectDelay, this._reconnectTimeout * 2);
                    this.attemptConnection(tokenFactory);
                },
            );
    }

    private resetReconnection() {
        this._reconnectSubscription?.unsubscribe();
        this._reconnectTimeout = initialReconnectDelay;
        this._reconnectSubscription = undefined;
    }
}
