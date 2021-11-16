// const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
// const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;
// const { merge } = require('webpack-merge');
// // const webpack = require('webpack');
// // const deps = require('./package.json').dependencies;

// const mf = require("@angular-architects/module-federation/webpack");
// const shareAll = mf.shareAll;

// module.exports = (config, options, env) => {
//     const mfConfig = {
//         output: {
//             uniqueName: "addon",
//             publicPath: "http://localhost:4400/"
//         },
//         optimization: {
//             runtimeChunk: false
//         },
//         plugins: [
//             new ModuleFederationPlugin({
//                 // remotes: {},
//                 name: "addon",
//                 filename: "addon.js",
//                 exposes: {
//                     // './AppModule': './src/app/app.module.ts',
//                     './PageBuilderModule': './src/app/components/page-builder/page-builder.module.ts',
//                     // './PageBuilderComponent': './src/app/components/page-builder/page-builder.component.ts',
//                     // './PageManagerModule': './src/app/components/page-manager/page-manager.module.ts',
                    
//                 },
//                 shared: {
//                     // ...deps,
//                     "@angular/core": { eager: true, singleton: true, strictVersion: false },
//                     "@angular/common": { eager: true, singleton: true, strictVersion: false },
//                     "@angular/common/http": { eager: true, singleton: true, strictVersion: false },
//                     "rxjs": { eager: true, singleton: true, strictVersion: false },
//                     "@ngx-translate/core": { eager: true, singleton: true, strictVersion: false },
//                     "@angular/router": { eager: true, singleton: true,  strictVersion: false },
//                     "@pepperi-addons/ngx-lib": { eager: true, singleton: true,  strictVersion: false }
//                 }
//             })
//         ],
//     };

//     const merged = merge(config, mfConfig);
//     const singleSpaWebpackConfig = singleSpaAngularWebpack(merged, options);
//     return singleSpaWebpackConfig;
//     // Feel free to modify this webpack config however you'd like to
// };


const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const mf = require("@angular-architects/module-federation/webpack");
const path = require("path");
const share = mf.share;
const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;
const { merge } = require('webpack-merge');

const sharedMappings = new mf.SharedMappings();
sharedMappings.register(
    path.join(__dirname, './tsconfig.json'),
    [
        /* mapped paths to share */
        "ngx-lib"
    ]);

module.exports = (config, options, env) => {
    const mfConfig = {
        output: {
            uniqueName: "addon",
            publicPath: "http://localhost:4400/",
            // libraryTarget: "umd"
        },
        optimization: {
            runtimeChunk: false
        },   
        resolve: {
            alias: {
            ...sharedMappings.getAliases(),
            }
        },
        plugins: [
            new ModuleFederationPlugin({
                name: "addon",
                filename: "addon.js",
                exposes: {
                    // './AppModule': './src/app/app.module.ts',
                    './PageBuilderModule': './src/app/components/page-builder/page-builder.module.ts',
                    // './PageBuilderComponent': './src/app/components/page-builder/page-builder.component.ts',
                    // './PageManagerModule': './src/app/components/page-manager/page-manager.module.ts',
                    
                },
                shared: share({
                "@angular/core": { eager: true, singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
                "@angular/common": { eager: true, singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
                "@angular/common/http": { eager: true, singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
                "@angular/router": { eager: true, singleton: true, strictVersion: true, requiredVersion: 'auto' },
                // "@pepperi-addons/ngx-lib": {eager: true,  singleton: true, strictVersion: true, requiredVersion: 'auto' },
                
                ...sharedMappings.getDescriptors()
                })
                
            }),
            sharedMappings.getPlugin()
        ],
    }

    const merged = merge(config, mfConfig);
    const singleSpaWebpackConfig = singleSpaAngularWebpack(merged, options);
    singleSpaWebpackConfig.entry.main = [...new Set(singleSpaWebpackConfig.entry.main)];
    return singleSpaWebpackConfig;
    // Feel free to modify this webpack config however you'd like to
};