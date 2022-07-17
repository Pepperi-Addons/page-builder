import '@pepperi-addons/cpi-node'
import ClientPagesService from './client-pages-service';
import FilesService from './files-service'; 

export const router = Router();

export async function load(configuration: any) {
    pepperi.events.intercept('SyncTerminated' as any, {}, async (data, next, main) => {
        // TODO only for mobile
        if(await pepperi["configuration"].isWebApp()) {
            const isResync = data.JobInfoResponse?.ClientInfo?.LastSyncDateTime == 0;
            if (isResync) {
                const filesService = new FilesService();
                await filesService.downloadFiles(); 
                console.log("resync pages files finished");
            }
        }
        await next(main);
    });
}

router.get('/get_page_data/:pageKey', async (req, res) => {
    let result = {};

    try {
        const pageKey = req.params.pageKey;
        if (pageKey) {
            const service = new ClientPagesService();
            result = await service.getPageData(pageKey);
        }
    } catch (err) {
        console.log(err);
        result = {
            error: JSON.stringify(err)
        }
    }

    res.json(result);
});
// Get the page by Key
router.get("/pages/:key", async (req, res) => {
    let page = {};
    
    try {
        console.log("CPISide - GET page with query params (page key)");
        // pages = await pepperi.api.adal.getList({ 
        //     addon: '50062e0c-9967-4ed4-9102-f2bc50602d41',
        //     table: 'Pages'
        // }).then(obj => obj.objects);
        page = await pepperi.api.adal.get({ 
            addon: '50062e0c-9967-4ed4-9102-f2bc50602d41',
            table: 'Pages',
            key: req.params.key
        }).then(obj => obj.object);

    } catch(exception) {
        // Handle exception.
    }

    res.json({ result: page });
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