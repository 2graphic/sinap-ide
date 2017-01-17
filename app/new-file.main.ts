// File: new-file.main.ts
// Created by: Daniel James
// Date created: January 17, 2017
//
// Entry point for New File window.
//

import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { enableProdMode } from '@angular/core';

import { NewFileModule } from "./new-file.module";

if (process.env.ENV === 'production') {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(NewFileModule);
