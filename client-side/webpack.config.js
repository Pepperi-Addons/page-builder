const { shareAll, share, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
    name: "page_builder",
    filename: "page_builder.js",
    exposes: {
        './SettingsModule': './src/app/components/settings/index.ts',
        './PageBuilderModule': './src/app/components/page-builder/index.ts'
    },
    shared: {
        ...shareAll({ strictVersion: true, requiredVersion: 'auto' }),
    },
    // shared: share({
    //     "@angular/core": { strictVersion: true, requiredVersion: 'auto' }, 
    //     "@angular/common": { strictVersion: true, requiredVersion: 'auto' }, 
    //     "@angular/common/http": { strictVersion: true, requiredVersion: 'auto' }, 
    //     "@angular/router": { strictVersion: true, requiredVersion: 'auto' },
    // })
});