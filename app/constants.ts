import { remote } from "electron";
const process = remote.require("process");

export const IS_PRODUCTION = process.env.NODE_ENV === "production";