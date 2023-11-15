import '@pepperi-addons/cpi-node'
import { IContextWithData } from '@pepperi-addons/cpi-node/build/cpi-side/events';
import { CLIENT_ACTION_ON_CLIENT_PAGE_BLOCK_LOAD, CLIENT_ACTION_ON_CLIENT_PAGE_BUTTON_CLICK, CLIENT_ACTION_ON_CLIENT_PAGE_LOAD, 
    CLIENT_ACTION_ON_CLIENT_PAGE_STATE_CHANGE, IPageClientEventResult } from 'shared';
import ClientPagesService from './client-pages.service';

export const router = Router();

export async function load(configuration: any) {
    // Handle on page load.
    pepperi.events.intercept(CLIENT_ACTION_ON_CLIENT_PAGE_LOAD as any, {}, async (data: IContextWithData): Promise<IPageClientEventResult> => {
        // debugger;
        const service = new ClientPagesService();
        const result = await service.getPageLoadData(data);
        return result;
    });

    // Handle on page state change.
    pepperi.events.intercept(CLIENT_ACTION_ON_CLIENT_PAGE_STATE_CHANGE as any, {}, async (data: IContextWithData): Promise<IPageClientEventResult> => {
        // debugger;
        const service = new ClientPagesService();
        const result = await service.getPageStateChangeData(data);
        return result;
    });

    // Handle on page state change.
    pepperi.events.intercept(CLIENT_ACTION_ON_CLIENT_PAGE_BUTTON_CLICK as any, {}, async (data: IContextWithData): Promise<IPageClientEventResult> => {
        // debugger;
        const service = new ClientPagesService();
        const result = await service.getPageButtonClickData(data);
        return result;
    });
    
    // Handle on block load - For editor.
    pepperi.events.intercept(CLIENT_ACTION_ON_CLIENT_PAGE_BLOCK_LOAD as any, {}, async (data: IContextWithData): Promise<IPageClientEventResult> => {
        const service = new ClientPagesService();
        const result = await service.getPageBlockLoadData(data);
        return result;
    });

    // Handle on get block loader data.
    pepperi.events.intercept('GetBlockLoaderData' as any, {}, async (data): Promise<any> => {
        const blockType = data.BlockType || 'AddonBlock';
        const name = data.Name || '';
        const service = new ClientPagesService();
        const res = await service.getBlockData(blockType, name);
        return res;
    });
}

router.get('/get_page_data', async (req, res, next) => {
    let result = {};

    try {
        const pageKey = req.query['key']?.toString();
        if (pageKey) {
            const service = new ClientPagesService();
            result = await service.getPageDataOld(pageKey, req.context);
        }
    } catch (err) {
        console.log(err);
        next(err)
    }

    res.json(result);
});

// router.get('/get_blocks_data', async (req, res, next) => {
//     let result = {};

//     try {
//         const blockType = req.query['blockType']?.toString() || 'AddonBlock';
//         const name = req.query['name']?.toString() || '';
//         const service = new ClientPagesService();
//         result = await service.getBlocksData(blockType, name);
//     } catch (err) {
//         console.log(err);
//         next(err)
//     }

//     res.json(result);
// });

// Get the page by Key
router.get("/pages/:key", async (req, res) => {
    let result = {};
    
    try {
        console.log("CPISide - GET page with query params (page key)");
        // page = await pepperi.api.adal.get({ 
        //     addon: '50062e0c-9967-4ed4-9102-f2bc50602d41',
        //     table: 'Pages',
        //     key: req.params.key
        // }).then(obj => obj.object);

        const service = new ClientPagesService();
        result = await service.getPage(req.params.key);

    } catch(exception) {
        // Handle exception.
    }

    res.json(result);
});

// Example get function from Dor
// //setup routers for router automation tests
// router.get("/addon-api/get", (req, res) => {
//     console.log("AddonAPI test currently on CPISide - GET with query params");
//     const queryString = req.query.q;
//     if (
//       queryString === "queryParam" &&
//       queryString !== null &&
//       queryString !== undefined
//     ) {
//       res.json({
//         result: "success",
//         params: queryString,
//       });
//     }
//     res.json({ result: "failure" });
// });
// router.post("/pages")