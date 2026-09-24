import { ApplicationConfig } from "@angular/core";
import { WindowProvider } from "../window-provider";
import { LocalStorageService } from "./services/local-storage.service";
import { RestControllerService } from "./services/rest-controller.service";
import { routes } from './app-routing.module'
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";

export const appConfig: ApplicationConfig = {
    providers: [provideRouter(routes),RestControllerService, LocalStorageService, WindowProvider,provideHttpClient(withInterceptorsFromDi())],
}