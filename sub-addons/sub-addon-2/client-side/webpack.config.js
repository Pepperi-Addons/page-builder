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
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new ModuleFederationPlugin({
      name: "sub_addon_2",
      filename: "sub_addon_2.js",
      exposes: {
        './SubAddon2Component': './src/app/sub-addon/index.ts',
        './SubAddon2Module': './src/app/sub-addon/index.ts'

      },
      shared: {
        "@angular/core": {  strictVersion: false  },
        "@angular/common": {strictVersion: false   }
      }
    }),
  ]
};
