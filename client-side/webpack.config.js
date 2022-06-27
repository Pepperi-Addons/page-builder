// const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

// module.exports = withModuleFederationPlugin({
//     shared: {
//         ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
//     },
// });


const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const mf = require("@angular-architects/module-federation/webpack");
const path = require("path");
const share = mf.share;
const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;
const { merge } = require('webpack-merge');

// file_name should be lowercase and if it more then one word put '_' between them,
const filename = `page_builder`;

const sharedMappings = new mf.SharedMappings();
sharedMappings.register(
    path.join(__dirname, './tsconfig.json'),
    [
        /* mapped paths to share */
    ]);

module.exports = (config, options, env) => {
    const mfConfig = {
        output: {
            publicPath: "auto",
            uniqueName: `${filename}`,
            chunkFilename: `${filename}.[name].js`,
            scriptType: 'text/javascript'
        },
        // experiments: {
        //     topLevelAwait: true,
        // },
        optimization: {
            // Only needed to bypass a temporary bug
            runtimeChunk: false
        },
        resolve: {
            alias: {
                ...sharedMappings.getAliases(),
            }
        },
        plugins: [
            new ModuleFederationPlugin({
                // library: { type: "module" },
                name: `${filename}`,
                filename: `${filename}.js`,
                exposes: {
                    // './SettingsModule': './src/app/components/settings/index.ts',
                    './PageBuilderModule': './src/app/components/page-builder/index.ts'
                },
                shared: share({
                    // "@angular/core": { eager: true, requiredVersion: 'auto' },
                    // "@angular/common": { eager: true, requiredVersion: 'auto' },
                    // "@angular/common/http": { eager: true, requiredVersion: 'auto' }, 
                    // "@angular/router": { eager: true, requiredVersion: 'auto' },
                    
                    "@angular/core": { eager: true, singleton: true, strictVersion: true, requiredVersion: '>=12.0.0'  },
                    "@angular/common": { eager: true, singleton: true, strictVersion: true, requiredVersion: '>=12.0.0'  }, 
                    "@angular/common/http": { eager: true, singleton: true, strictVersion: true, requiredVersion: '>=12.0.0'  }, 
                    "@angular/router": { eager: true, singleton: true, strictVersion: true, requiredVersion: '>=12.0.0' },
                    "@pepperi-addons/ngx-lib": { eager: true, singleton: true, strictVersion: true, requiredVersion: 'auto' },
                    "@ngx-translate/core": { eager: true, singleton: true, strictVersion: true, requiredVersion: '>=13.0.0' },
                    // "@ngx-translate/http-loader": { eager: true, singleton: true, strictVersion: true, requiredVersion: '>=6.0.0' },

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

// module.exports = {
//     output: {
//         uniqueName: filename,
//         publicPath: "auto"
//     },
//     optimization: {
//         // Only needed to bypass a temporary bug
//         runtimeChunk: false
//     },   
//     resolve: {
//         alias: {
//         ...sharedMappings.getAliases(),
//         }
//     },
//     plugins: [
//         // new webpack.ProvidePlugin({
//         //     process: 'process/browser',
//         // }),
//         new ModuleFederationPlugin({
//             name: filename,
//             filename: `${filename}.js`,
//             exposes: {
//                 './AppModule': './src/app/index.ts',
//                 './PageBuilderModule': './src/app/components/page-builder/index.ts'
//             },
//             shared: share({
//                 "@angular/core": { eager: true, singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
//                 "@angular/common": { eager: true, singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
//                 "@angular/common/http": { eager: true, singleton: true, strictVersion: true, requiredVersion: 'auto' }, 
//                 "@angular/router": { eager: true, singleton: true, strictVersion: true, requiredVersion: 'auto' },
                
//                 ...sharedMappings.getDescriptors()
//             })
//         }),
//         sharedMappings.getPlugin()
//     ]
// };
