// File: main.ts
// Created by: Daniel James
// Date created: January 17, 2017
//
// Entry point for New File window.
//

import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { enableProdMode } from '@angular/core';

import { ModalWindowModule } from "./modal-window.module";
import { IS_PRODUCTION } from "../constants";

import "file-loader?name=modal.html!extract-loader!./index.html";

if (IS_PRODUCTION) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(ModalWindowModule);
