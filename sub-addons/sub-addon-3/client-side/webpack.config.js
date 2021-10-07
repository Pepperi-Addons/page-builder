const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const webpack = require('webpack');

module.exports = {
    output: {
        uniqueName: "sub_addon_3",
        publicPath: "auto"
    },
    optimization: {
        // Only needed to bypass a temporary bug
        runtimeChunk: false
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
        new ModuleFederationPlugin({
            name: "sub_addon_3",
            filename: "sub_addon_3.js",
            exposes: {
                './SubAddon3Module': './src/app/sub-addon/index.ts',
                './SubAddon3EditorModule': './src/app/sub-addon-editor/index.ts',
            },
            shared: {
                "@angular/core": { singleton: true,  strictVersion: false  },
                "@angular/common": {singleton: true,strictVersion: false   },
                "rxjs": { singleton: true,strictVersion: false   },
                "@ngx-translate/core": { singleton: true, strictVersion: false   },
                "@angular/router": { eager: true, singleton: true,  strictVersion: false }
            }
        }),
    ]
};
