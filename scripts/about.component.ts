// File: about.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016


import { Component } from "@angular/core";


/**
 * process
 *   Required so that the TypeScript compiler does not complain about missing
 *   properties in ProcessVersion.
 */
declare var process;


@Component({
  moduleId: module.id,
  selector: "sinap-about",
  templateUrl: "../html/about.component.html"
})
export class AboutComponent {
  version = process.env.npm_package_version;
  shellVersion = process.versions.electron;
  rendererVersion = process.versions.chrome;
  nodeVersion = process.versions.node;
}
