// File: main.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main entry point for AngularJS 2.
//

import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { enableProdMode } from '@angular/core';

import { MainModule } from "./main.module";
import { remote } from "electron";
const process = remote.require("process");

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

import "file-loader?name=index.html!extract-loader!./index.html";

if (IS_PRODUCTION) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(MainModule);
