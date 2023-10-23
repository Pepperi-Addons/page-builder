import { Client, Request } from '@pepperi-addons/debug-server'
import { CLIENT_ACTION_ON_CLIENT_PAGE_BUTTON_CLICK } from 'shared';
import { PagesApiService } from './pages-api.service'

export async function get_filter_by_event(client: Client, request: Request): Promise<any> {

    if (request.method === 'GET') {
        const service = new PagesApiService(client);
        const pagesOptionalValues: {Key: string, Value: any}[] = await service.getPagesOptionalValues();

        const eventString = request.query.event;
        const fields: any[] = [{
            FieldID: "PageKey",
            FieldType: "String",
            Title: "Page key",
            OptionalValues: pagesOptionalValues
        }];

        if (eventString === CLIENT_ACTION_ON_CLIENT_PAGE_BUTTON_CLICK) {
            fields.push({
                FieldID: "ButtonKey",
                FieldType: "String",
                Title: "Block Button key",
            });
        }
        
        return {
            Fields: fields
        };

    } else {
        throw new Error('Method not supported')
    }
}