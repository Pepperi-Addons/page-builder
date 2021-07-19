const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const webpack = require('webpack');

module.exports = {
  output: {
    uniqueName: "SubAddon3Module",
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
      name: "sub_addon_4",
      filename: "sub_addon_4.js",
      exposes: {
        './SubAddon4Component': './src/app/sub-addon/index.ts',
        './SubAddon4Module': './src/app/sub-addon/index.ts'

      },
      shared: {
        "@angular/core": {  strictVersion: false  },
        "@angular/common": {strictVersion: false   }
      }
    }),
  ]
};
