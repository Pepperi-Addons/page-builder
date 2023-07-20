import { Injectable } from '@angular/core';
import { IPageState } from 'shared';

export interface IPageQueryParams {
    [key: string]: any;
    blocksState?: any;
}

@Injectable({
    providedIn: 'root',
})
export class QueryParamsService {
    
    getQueryParamsFromState(state: IPageState): IPageQueryParams {
        const pageParameters = state.PageParameters;
        const blocksState = state.BlocksState;
        const blocksStateHasValue = blocksState && Object.keys(blocksState).length > 0;

        // Construct blocksState and pageParameters to queryParams
        return { 
            ...pageParameters,
            ...(blocksStateHasValue && { blocksState: JSON.stringify(blocksState) })
        };
    }

    getStateFromQueryParams(queryParams: IPageQueryParams): IPageState {
        // Destruct the queryParams to blocksState and pageParameters
        const { blocksState, ...pageParameters } = queryParams;
        const initialPageState: IPageState = {
            PageParameters: pageParameters,
            BlocksState: JSON.parse(blocksState || "{}")
        }

        return initialPageState;
    }
}