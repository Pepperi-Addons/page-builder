module.exports = require('./webpack.config');

// const { shareAll, share, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');
// const TerserPlugin = require('terser-webpack-plugin');
// const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");

// const blockName = 'page_builder';

// module.exports = (angularWebpackConfig, options) => {
//     return {
//         ...angularWebpackConfig,
//         module: {
//             ...angularWebpackConfig.module,
//             rules: [
//                 ...angularWebpackConfig.module.rules,
//                 {
//                     parser: {
//                         system: false
//                     }
//                 }
//             ]
//         },
//         output: {
//             uniqueName: blockName,
//             publicPath: "auto"
//         },
//         externals: {
//         },
//         optimization: {
//             // Only needed to bypass a temporary bug
//             runtimeChunk: false,
//             minimize: true,
//             minimizer: [
//             new TerserPlugin({
//                 terserOptions: {keep_fnames: /^.$/}
//             })]
//         },
//         plugins: [
//             ...angularWebpackConfig.plugins,
//             new ModuleFederationPlugin({
//                 name: blockName,
//                 filename: `${blockName}.js`,
//                 exposes: {
//                     './SettingsModule': './src/app/components/settings/index.ts',
//                     './PageBuilderModule': './src/app/components/page-builder/index.ts'
//                 },
//                 shared: {
//                     ...shareAll({ strictVersion: true, requiredVersion: 'auto' }),
//                 },
//             })
//         ]
//     };
// }