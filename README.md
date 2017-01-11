# Project: Sinap
## Authors: Sheyne Anderson, CJ Dimaano, Dyllon Garnier, Daniel James
### Date created: October 10, 2016


# Getting Started

Navigate to the project root directory before running any commands. E.g.:

```$ cd /path/to/sinap-ide```

For Linux and MacOS, use the following command to build and run the application:  
> TODO: Use Gulp or something like it instead of NPM scripts.  
> TODO: Make this README more useful/pretty  

```$ npm run start:build```

For Windows:

```$ npm run start:build:win```

Use the following command to build and package the electron app (places apps in the dist folder):

```$ npm run package```

app/index.ts = Starting point for Electron application.  
app/main.ts = Starting point for Angular 2 application.  
app/main.module.ts = Our module for the Sinap IDE  
app/vendors.ts = Import all libraries we're using. (Currently on Angular)  
app/polyfills.ts = IDK ok
