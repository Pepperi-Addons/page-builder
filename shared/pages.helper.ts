import { IAvailableBlockData, IBlockLoaderData } from "./pages.model";

function getRemoteEntry(devBlocks: Map<string, string>, ab: IBlockLoaderData): string {
    let ret;
    
    if (devBlocks.has(ab.relation.ElementName)) {
        ret = devBlocks.get(ab.relation.ElementName);
    } else if (ab.relation.ComponentName && devBlocks.has(ab.relation.ComponentName)) {
        ret = devBlocks.get(ab.relation.ComponentName);
    } 
    
    if (!ret || ret === '') {
        ret = `${ab.addonPublicBaseURL}${ab.relation.AddonRelativeURL}.js`;
    }

    return ret;
}

export function getAvailableBlockData(availableBlocks: IBlockLoaderData[], devBlocksValue: any): IAvailableBlockData[]  {
    // Load dev blocks
    let devBlocks = new Map<string, string>();
    try {
        const devBlocksAsJSON = JSON.parse(devBlocksValue);
        devBlocks = new Map(devBlocksAsJSON);
    } catch { /* Do noting */ }

    const availableBlocksData: IAvailableBlockData[] = availableBlocks.map(ab => {
        return {
            RelationName: ab.relation.Name,
            RelationAddonUUID: ab.relation.AddonUUID,
            PageRemoteLoaderOptions: {
                RemoteEntry: getRemoteEntry(devBlocks, ab),
                ModuleName: ab.relation.ElementsModule,
                ElementName: ab.relation.ElementName,
                // EditorElementName: ab.relation.EditorElementName,
                ...(ab.relation.EditorElementName?.length > 0 && { EditorElementName: ab.relation.EditorElementName }),
            }
        }
    });

    return availableBlocksData;
}