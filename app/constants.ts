import { remote } from "electron";
declare const sinap: any;

export const IS_PRODUCTION = sinap.ENV === "production";