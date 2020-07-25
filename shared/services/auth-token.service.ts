import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { IAuthToken, ITokenStore } from '../contracts';
import { Inject } from '@angular/core';

@Injectable()
export class AuthTokenService {
    constructor(@Inject('tokenStore') private tokenStore: ITokenStore) {}

    private _tokenStream: Subject<IAuthToken | undefined> = new Subject();

    public get tokenStream() {
        return this._tokenStream;
    }

    public get authToken(): IAuthToken | undefined {
        return this.tokenStore.token;
    }

    public set authToken(value: IAuthToken | undefined) {
        this.tokenStore.token = value;

        this.tokenStream.next(value);
    }
}
