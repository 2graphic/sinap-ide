// File: polyfills.ts
// Created by: Daniel James
// Date created: January 2, 2017
//
// Legacy support... I believe.
//

import 'core-js/es6';
import 'core-js/es7/reflect';
import 'zone.js/dist/zone.js';

declare const sinap: any;

if (sinap.ENV === 'production') {
    // Production
} else {
    // Development
    Error['stackTraceLimit'] = Infinity;
}