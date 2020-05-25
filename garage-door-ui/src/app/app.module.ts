import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './components/app/app.component';
import { AuthHttpInterceptor } from './interceptors/bearer-token.interceptor';
import { AuthTokenService, GarageDoorHttpService } from './services';
import { LoginComponent } from './components/login/login.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthGuard } from './route-guards/auth.guard';
import { LoggedInGuard } from './route-guards/logged-in.guard';
import { GarageDoorComponent } from './components/garage-door/garage-door.component';
import { SocketIoModule } from 'ngx-socket-io';
import { environment } from '../environments/environment';

console.log(`IO connecting to ${environment.updatesUrl}`);

@NgModule({
    declarations: [AppComponent, LoginComponent, GarageDoorComponent],
    imports: [
        BrowserModule,
        HttpClientModule,
        FormsModule,
        AppRoutingModule,
        SocketIoModule.forRoot({ url: environment.updatesUrl }),
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
        AuthTokenService,
        AuthGuard,
        LoggedInGuard,
        GarageDoorHttpService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
