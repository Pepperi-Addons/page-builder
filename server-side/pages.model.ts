// TODOL: This is copied from ngx-loader cause we don't wan't to install Angular dependencies (need to find solution for this object).
export type RemoteModuleOptions = {
    // Those are LoadRemoteModuleOptions properties from '@angular-architects/module-federation';
    // **********************************************************************************************
    remoteEntry?: string;
    remoteName: string;
    exposedModule: string;
    // **********************************************************************************************
    moduleData?: object;
    componentName: string;
    title: string;
    visibleEndpoint?: string;
    multiSelection?: boolean | string ;
    confirmation?: boolean;
    // type: string | string[];
    // subType: string | string[];
    uuid: string;
    update?: boolean;
    noModule?: boolean;
    // [key:string]: any; If anyone will need it then add it!!!
}

export const Configuration ={
    "configuration": {
        "consume": {
            "filter": {
                "resource": "transaction_lines",
                "fields":  ["UnitsQuantity", "Item.TSABrand", "Transaction.Account.Type", "Transaction.Status"],
            },

            "context": {
                "resource": "transaction"
            }
        },
        "produce": {
            "filter": {
                "resource": "transaction",
                "fields":  ["UnitsQuantity", "Item.TSABrand", "Transaction.Account.Type", "Transaction.Status"],
            },

            "context": {
                "resource": "transaction_lines"
            }
        },
        "title": "Hello World",
        "imageURL": "https://hatrabbits.com/wp-content/uploads/2017/01/random.jpg"
    },
    "pageType": "HomePage",
    "context": {
        "transaction": {
            "uuid": "9cacbd52-1f39-4749-a9fa-9fc0ac04eeee"
        },
        "account": {
            "uuid": "fe24b2bb-e8d1-4201-b066-5dd710d04f23"
        }
    },
    "filter": {
        "Operation": "AND",
        "RightNode": {
            "FieldType": "String",
            "ApiName": "Transaction.Account.Type",
            "Operation": "IsEqual",
            "Values": ["Customer"]
        },
        "LeftNode": {
            "Operation": "AND",
            "RightNode": {
                "FieldType": "Number",
                "ApiName": "Transaction.Status",
                "Operation": "IsEqual",
                "Values": ["2"]
            },
            "LeftNode": {
                "FieldType": "String",
                "ApiName": "Item.TSABrand",
                "Operation": "IsNotEmpty",
                "Values": []
            }
        }
    }
};