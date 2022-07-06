const { shareAll, share, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');
const blockName = 'page_builder';

module.exports = withModuleFederationPlugin({
    name: blockName,
    filename: `${blockName}.js`,
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