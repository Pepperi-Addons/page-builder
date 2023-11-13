import { Client } from '@pepperi-addons/debug-server';
// import { PapiClient, InstalledAddon, NgComponentRelation, Page, AddonDataScheme, PageSection, SplitTypes, DataViewScreenSizes, 
//     PageBlock, PageSectionColumn, PageSizeTypes, PageLayout, Subscription, FindOptions, ResourceDataConfiguration } from '@pepperi-addons/papi-sdk'
import { DRAFT_PAGES_TABLE_NAME, PagesApiService } from "./pages-api.service";
import semver from 'semver';
import { Page } from '@pepperi-addons/papi-sdk';
import { PAGES_TABLE_NAME } from 'shared';

const pnsKeyForDraftPages = 'uninstall_blocks_subscription_draft';
const pnsFunctionPathForDraftPages = '/internal_api/on_uninstall_block_draft';

export class PagesUpgradeService extends PagesApiService {
    constructor(client: Client) {
        super(client);
    }

    //**************************************************************************************
    //*     Upgrade to version 61 - change column.Block to column.BlockContanier - Begin
    //**************************************************************************************
    // private updateConfigurationProperty(page: Page) {
    //     page.Blocks.forEach(block => {
    //         if (block.Configuration === undefined || block.Configuration.Resource === undefined) {
    //             const configurationToSet: ResourceDataConfiguration = {
    //                 Resource: block.Relation.Name,
    //                 AddonUUID: block.Relation.AddonUUID,
    //                 Data: Object.assign({}, block.Configuration || {})
    //             };

    //             block.Configuration = configurationToSet;
    //         }
    //     });
    // }

    // private updateToBlockContainerProperty(page: Page) {
    //     page.Layout.Sections.forEach(section => {
    //         section.Columns.forEach(column => {
    //             if (column['Block'] && column.BlockContainer === undefined) {
    //                 column.BlockContainer = Object.assign({}, column['Block']);
    //                 delete column['Block'];
    //             }
    //         });
    //     });
    // }

    // private updateSizeTypeProperty(object: any, property: string) {
    //     if (object[property]?.length > 0) {
    //         const propertyValue: string = object[property];
    //         object[property] = propertyValue.toLowerCase();
    //     }
    // }

    // private async updatePageProperties(tableName: string, saveChanges = false) {
    //     let pages: Page[] = await this.getPagesFrom(tableName);

    //     for (let index = 0; index < pages.length; index++) {
    //         const page = pages[index];
    //         this.updateConfigurationProperty(page);
    //         this.updateToBlockContainerProperty(page);
            
    //         this.updateSizeTypeProperty(page.Layout, 'SectionsGap');
    //         this.updateSizeTypeProperty(page.Layout, 'ColumnsGap');
    //         this.updateSizeTypeProperty(page.Layout, 'HorizontalSpacing');
    //         this.updateSizeTypeProperty(page.Layout, 'VerticalSpacing');
            
    //         if (saveChanges) {
    //             await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).upsert(page);
    //         }
    //     }
    // }

    // async upgradeToVersion61(saveChanges = false) {
    //     await this.updatePageProperties(PAGES_TABLE_NAME, saveChanges);
    //     await this.updatePageProperties(DRAFT_PAGES_TABLE_NAME, saveChanges);
    // }

    //**************************************************************************************
    //*      Upgrade to version 61 - change column.Block to column.BlockContanier - End
    //**************************************************************************************

    // migrate from the old cpi node file approach the the new one

    async performMigration(fromVersion, toVersion) {
        await this.migrateToV2_0_0(fromVersion);
    }

    //*********************************************************************************************
    //*     Upgrade to version 2.0.0 - change to work with configuration instead of ADAL - Begin
    //*********************************************************************************************
    
    private async removeDimxRelations() {
        const importRelation = this.getImportRelation();
        importRelation.Hidden = true;
        await this.upsertRelation(importRelation);

        const exportRelation = this.getExportRelation();
        exportRelation.Hidden = true;
        await this.upsertRelation(exportRelation);
    }

    private async removeAdalSchema() {
        const DIMXSchema = {
            Blocks: {
                Type: "Array",
                Items: {
                    Type: "Object",
                    Fields: {
                        Configuration: {
                            Type: "ContainedDynamicResource"
                        }
                    }
                }
            },
        };

        // Create pages table
        await this.papiClient.addons.data.schemes.post({
            Name: PAGES_TABLE_NAME,
            Hidden: true,
            Type: 'meta_data',
            SyncData: {
                Sync: true
            }
        });
        
        // Create pages draft table
        await this.papiClient.addons.data.schemes.post({
            Name: DRAFT_PAGES_TABLE_NAME,
            Hidden: true,
            Type: 'meta_data',
            Fields: DIMXSchema as any // Declare the schema for the import & export.
        });
    }

    private async copyOldPagesToConfigurations() {
        // Copy the published pages to configuration
        try {
            const publishedPages = await this.papiClient.addons.data.uuid(this.addonUUID).table(PAGES_TABLE_NAME).find() as Page[];

            for (let index = 0; index < publishedPages.length; index++) {
                const page = publishedPages[index];
                if (page?.Key) {
                    const draft = this.convertPageToDraft(page);
                    // Save it
                    await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.upsert(draft);
                    // Publish it
                    await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.key(page.Key).publish();
                }
            }
        } catch (error) {
            console.log(error);
        }
        
        // Copy the draft pages to configuration
        try {
            const draftPages = await this.papiClient.addons.data.uuid(this.addonUUID).table(DRAFT_PAGES_TABLE_NAME).find() as Page[];

            for (let index = 0; index < draftPages.length; index++) {
                const page = draftPages[index];
                if (page?.Key) {
                    const draft = this.convertPageToDraft(page);
                    // Save it
                    await this.papiClient.addons.configurations.addonUUID(this.addonUUID).scheme(PAGES_TABLE_NAME).drafts.upsert(draft);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    private async migrateToV2_0_0(fromVersion) {
        // check if the upgrade is from versions before 2.0.0
        console.log('semver comperation' + semver.lt(fromVersion, '2.0.0') + ' fromVersion: ' + fromVersion);
        if (fromVersion && semver.lt(fromVersion, '2.0.0')) {
            // Copy all pages from publish to configuration and publish it and after that copy from draft into configuration without publishing it.
            await this.copyOldPagesToConfigurations();
            
            // Remove the import export relations
            await this.removeDimxRelations();
            
            // Remove the ADAL scheme from the addon ??
            await this.removeAdalSchema();

            // Unsubscribe from the uninstall blocks subscription for draft pages.
            await this.unsubscribeUninstallAddons(pnsKeyForDraftPages, pnsFunctionPathForDraftPages);
        }
    }

    //*********************************************************************************************
    //*     Upgrade to version 2.0.0 - change to work with configuration instead of ADAL - End
    //*********************************************************************************************
}