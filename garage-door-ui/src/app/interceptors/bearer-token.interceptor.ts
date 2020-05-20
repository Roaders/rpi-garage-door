import { Observable } from 'rxjs';
import { tap, catchError, mergeMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpResponse, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { HttpRequest } from '@angular/common/http';
import { HttpHandler } from '@angular/common/http';
import { HttpEvent } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { AuthTokenService } from '../services/auth-token.service';
import { isAuthResponse, IAuthToken } from '../../../../shared';
import { Router } from '@angular/router';

function isAuthError(error: any): error is HttpErrorResponse {
    const authError = error as HttpErrorResponse;
    return authError instanceof HttpErrorResponse && authError.status === 401;
}

const exchangeUrl = 'api/exchangeToken';

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
    constructor(private authTokenService: AuthTokenService, private router: Router, private http: HttpClient) {}

    intercept<T>(request: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
        console.log(`request: ${request.url}`);

        return next.handle(this.addBearerToken(request)).pipe(
            catchError((error) => this.exchangeToken(error, request, next)),
            tap(
                (response) => this.updateAuthToken(response),
                (error) => this.navigateToLogin(error),
            ),
        );
    }

    private addBearerToken<T>(request: HttpRequest<T>) {
        if (this.authTokenService.authToken != null) {
            let token = this.authTokenService.authToken.access_token;

            if (request.url === exchangeUrl) {
                console.log(`USING Refresh token`);
                token = this.authTokenService.authToken.refresh_token;
            }

            console.log(`APPENDING TOKEN ${token}`);

            const headers = new HttpHeaders({
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json',
            });

            return request.clone({ headers });
        }
        return request;
    }

    private exchangeToken<T>(error: any, request: HttpRequest<T>, next: HttpHandler) {
        if (isAuthError(error) && request.url != exchangeUrl && this.authTokenService.authToken != null) {
            console.log(`EXCHANGE TOKEN`);
            return this.http.get<IAuthToken>(exchangeUrl).pipe(
                mergeMap(() => {
                    console.log(`Calling original request: ${request.url}`);
                    return next.handle(this.addBearerToken(request)) as Observable<HttpEvent<T>>;
                }),
            );
        } else {
            throw error;
        }
    }

    private navigateToLogin(error: any) {
        if (isAuthError(error)) {
            console.log(`NAVIGATING`);
            this.router.navigate(['login']);
        }
    }

    private updateAuthToken(response: HttpEvent<any>) {
        console.log(`updateAuthToken ${response.type}`);
        if (response instanceof HttpResponse && isAuthResponse(response.body)) {
            console.log(`setting token ${response.url} body: ${response.body.access_token}`);
            this.authTokenService.authToken = response.body;
        }
    }
}