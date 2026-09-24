import { ApplicationConfig, inject, provideAppInitializer } from "@angular/core";
import { WindowProvider } from "../window-provider";
import { LocalStorageService } from "./services/local-storage.service";
import { RestControllerService } from "./services/rest-controller.service";
import { routes } from './app-routing.module'
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { provideTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { LanguageService } from "./services/language.service";

export const appConfig: ApplicationConfig = {
    providers: [provideRouter(routes),RestControllerService, LocalStorageService, WindowProvider,provideHttpClient(withInterceptorsFromDi()),
        provideTranslateService({
            loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
            fallbackLang: LanguageService.DEFAULT_LANGUAGE,
        }),
        provideAppInitializer(() => inject(LanguageService).init()),
    ],
}
