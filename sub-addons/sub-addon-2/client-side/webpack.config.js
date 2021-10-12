const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const webpack = require('webpack');

module.exports = {
    output: {
        uniqueName: "sub_addon_2",
        publicPath: "auto"
    },
    optimization: {
        // Only needed to bypass a temporary bug
        runtimeChunk: false
    },
    plugins: [
        // new webpack.ProvidePlugin({
        //     process: 'process/browser',
        // }),
        new ModuleFederationPlugin({
            name: "sub_addon_2",
            filename: "sub_addon_2.js",
            exposes: {
                './SubAddon2Module': './src/app/sub-addon/index',
                './SubAddon2EditorModule': './src/app/sub-addon-editor/index'
            },
            shared: {
                "@angular/core": { eager: true, singleton: true, strictVersion: false },
                "@angular/common": { eager: true, singleton: true, strictVersion: false },
                "@angular/common/http": { eager: true, singleton: true, strictVersion: false },
                "rxjs": { eager: true, singleton: true, strictVersion: false },
                "@ngx-translate/core": { eager: true, singleton: true, strictVersion: false },
                "@angular/router": { eager: true, singleton: true,  strictVersion: false }
            }
        }),
    ]
};
