declare const sinap: any;

export const IS_PRODUCTION = sinap.ENV === "production";
export const IS_DEBUG = sinap.DEBUG;
export const SINAP_FILE_FILTER = [
    { name: 'Sinap Files', extensions: ['sinap'] }
];

export const ZIP_FILE_FILTER = { name: "Zip Archive", extensions: ["zip"] };
