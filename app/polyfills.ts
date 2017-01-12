// File: polyfills.ts
// Created by: Daniel James
// Date created: January 2, 2017
//
// Legacy support... I believe.
//

import 'core-js/es6';
import 'core-js/es7/reflect';
require('zone.js/dist/zone');

if (process.env.ENV === 'production') {
    // Production
} else {
    // Development
    Error['stackTraceLimit'] = Infinity;
    require('zone.js/dist/long-stack-trace-zone');
}