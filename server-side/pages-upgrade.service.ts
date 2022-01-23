import { Client } from '@pepperi-addons/debug-server';
import { PapiClient, InstalledAddon, NgComponentRelation, Page, AddonDataScheme, PageSection, SplitTypes, DataViewScreenSizes, PageBlock, PageSectionColumn, PageSizeTypes, PageLayout, Subscription, FindOptions, ResourceDataConfiguration } from '@pepperi-addons/papi-sdk'
import { DRAFT_PAGES_TABLE_NAME, PagesApiService, PAGES_TABLE_NAME } from "./pages-api.service";

export class PagesUpgradeService extends PagesApiService {
    constructor(client: Client) {
        super(client);
    }

    //**************************************************************************************
    //*     Upgrade to version 61 - change column.Block to column.BlockContanier - Begin
    //**************************************************************************************
    private updateConfigurationProperty(page: Page) {
        page.Blocks.forEach(block => {
            if (block.Configuration === undefined || block.Configuration.Resource === undefined) {
                const configurationToSet: ResourceDataConfiguration = {
                    Resource: block.Relation.Name,
                    AddonUUID: block.Relation.AddonUUID,
                    Data: Object.assign({}, block.Configuration || {})
                };

                block.Configuration = configurationToSet;
            }
        });
    }

    private updateToBlockContainerProperty(page: Page) {
        page.Layout.Sections.forEach(section => {
            section.Columns.forEach(column => {
                if (column['Block'] && column.BlockContainer === undefined) {
                    column.BlockContainer = Object.assign({}, column['Block']);
                    delete column['Block'];
                }
            });
        });
    }

    private updateSizeTypeProperty(object: any, property: string) {
        if (object[property]?.length > 0) {
            const propertyValue: string = object[property];
            object[property] = propertyValue.toLowerCase();
        }
    }

    private async updatePageProperties(tableName: string, saveChanges = false) {
        let pages: Page[] = await this.getPagesFrom(tableName);

        for (let index = 0; index < pages.length; index++) {
            const page = pages[index];
            this.updateConfigurationProperty(page);
            this.updateToBlockContainerProperty(page);
            
            this.updateSizeTypeProperty(page.Layout, 'SectionsGap');
            this.updateSizeTypeProperty(page.Layout, 'ColumnsGap');
            this.updateSizeTypeProperty(page.Layout, 'HorizontalSpacing');
            this.updateSizeTypeProperty(page.Layout, 'VerticalSpacing');
            
            if (saveChanges) {
                await this.papiClient.addons.data.uuid(this.addonUUID).table(tableName).upsert(page);
            }
        }
    }

    async upgradeToVersion61(saveChanges = false) {
        await this.updatePageProperties(PAGES_TABLE_NAME, saveChanges);
        await this.updatePageProperties(DRAFT_PAGES_TABLE_NAME, saveChanges);
    }

    //**************************************************************************************
    //*      Upgrade to version 61 - change column.Block to column.BlockContanier - End
    //**************************************************************************************
}