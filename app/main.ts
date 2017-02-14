// File: main.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main entry point for AngularJS 2.
//

import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { enableProdMode } from '@angular/core';

import { MainModule } from "./main.module";

import "file-loader?name=index.html!extract-loader!./index.html";

if (process.env.ENV === 'production') {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(MainModule);
