import { Client } from "@pepperi-addons/debug-server";
import { PapiClient } from "@pepperi-addons/papi-sdk";
// import AWS, { S3 } from "aws-sdk";
import { PagesApiService } from "./pages-api.service";
import { BlockFiles, IBlockLoaderData } from 'shared';
import config from '../addon.config.json';
import jwtDecode from 'jwt-decode';
class FilesService {
    BUCKET_NAME = 'pepperi-storage-production';

    papiClient: PapiClient;
    addonUUID: string;
    pagesApiService: PagesApiService;
    authToken: string;
    constructor(client: Client) {
        this.addonUUID = client.AddonUUID;

        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
        
        this.pagesApiService = new PagesApiService(client);
        // this.s3 = new AWS.S3();
        // only for debug        
        // this.s3 = this.createS3ForDebug();
        this.authToken = client.OAuthAccessToken;
    }
    getPageFilesToDownloadHack(): {Addons: BlockFiles[]} {
        // this object got from getPageFilesToDownload using temp s3 credentials
        // in the future we will get the files from zipped files supplied by the addon publisher 
        // https://pepperi.atlassian.net/browse/DI-20836
        return {
            "Addons": [
                // {
                //     "AddonUUID": "2d06b975-a03b-42c9-940a-a3a6f67d6d67", // client-actions-test
                //     "AddonVersion": "0.0.18",
                //     "Files": [
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/283.js",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/283.js"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/3rdpartylicenses.txt",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/3rdpartylicenses.txt"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/42.js",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/42.js"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/712.js",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/712.js"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/75.js",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/75.js"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/947.js",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/947.js"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/979.js",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/979.js"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/addon-cpi.js",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/addon-cpi.js"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/api.js",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/api.js"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/i18n/en.json",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/i18n/en.json"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/de.ngx-lib.json",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/de.ngx-lib.json"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/en.ngx-lib.json",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/en.ngx-lib.json"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/es.ngx-lib.json",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/es.ngx-lib.json"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/fr.ngx-lib.json",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/fr.ngx-lib.json"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/he.ngx-lib.json",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/he.ngx-lib.json"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/hu.ngx-lib.json",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/hu.ngx-lib.json"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/it.ngx-lib.json",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/it.ngx-lib.json"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/ja.ngx-lib.json",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/ja.ngx-lib.json"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/nl.ngx-lib.json",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/nl.ngx-lib.json"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/pl.ngx-lib.json",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/pl.ngx-lib.json"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/pt.ngx-lib.json",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/pt.ngx-lib.json"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/ru.ngx-lib.json",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/ru.ngx-lib.json"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/zh.ngx-lib.json",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/i18n/zh.ngx-lib.json"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/images/no-image.svg",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/images/no-image.svg"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/images/sail-away.jpg",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/assets/ngx-lib/images/sail-away.jpg"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/common.js",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/common.js"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/favicon.ico",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/favicon.ico"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/file_2d06b975_a03b_42c9_940a_a3a6f67d6d67.js",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/file_2d06b975_a03b_42c9_940a_a3a6f67d6d67.js"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/index.html",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/index.html"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/installation.js",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/installation.js"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/main.js",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/main.js"
                //         },
                //         {
                //             "name": "Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/polyfills.js",
                //             "url": "https://cdn.pepperi.com/Addon/Public/2d06b975-a03b-42c9-940a-a3a6f67d6d67/0.0.18/polyfills.js"
                //         }
                //     ]
                // },
                {
                    "AddonUUID": "5adbc9e0-ed1d-4b2d-98e9-9c50891812ea", //Gallery
                    "AddonVersion": "0.7.6",
                    "Files": [
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/3rdpartylicenses.txt",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/3rdpartylicenses.txt"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/753.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/753.js"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/760.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/760.js"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/827.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/827.js"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/api.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/api.js"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/i18n/en.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/i18n/en.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/de.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/de.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/en.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/en.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/es.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/es.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/fr.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/fr.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/he.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/he.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/hu.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/hu.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/it.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/it.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/ja.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/ja.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/nl.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/nl.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/pl.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/pl.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/pt.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/pt.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/ru.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/ru.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/zh.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/i18n/zh.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-full.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-full.svg"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-full@1x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-full@1x.png"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-full@2x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-full@2x.png"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-round.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-round.png"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-round.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-round.svg"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-round@2x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-round@2x.png"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-skiny.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-skiny.svg"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-skiny@1x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-skiny@1x.png"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-skiny@2x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-composite-lib/images/brand-leaf-skiny@2x.png"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/de.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/de.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/en.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/en.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/es.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/es.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/fr.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/fr.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/he.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/he.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/hu.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/hu.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/it.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/it.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/ja.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/ja.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/nl.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/nl.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/pl.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/pl.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/pt.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/pt.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/ru.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/ru.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/zh.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/i18n/zh.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/images/no-image.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/images/no-image.svg"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/images/sail-away.jpg",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/assets/ngx-lib/images/sail-away.jpg"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/gallery.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/gallery.js"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/index.html",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/index.html"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/installation.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/installation.js"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/main.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/main.js"
                        },
                        {
                            "name": "Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/polyfills.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/5adbc9e0-ed1d-4b2d-98e9-9c50891812ea/0.7.6/polyfills.js"
                        }
                    ]
                },
                {
                    "AddonUUID": "f93658be-17b6-4c92-9df3-4e6c7151e038", //Slideshow
                    "AddonVersion": "0.7.3",
                    "Files": [
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/161.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/161.js"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/333.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/333.js"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/39.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/39.js"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/3rdpartylicenses.txt",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/3rdpartylicenses.txt"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/48.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/48.js"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/api.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/api.js"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/i18n/en.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/i18n/en.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/de.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/de.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/en.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/en.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/es.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/es.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/fr.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/fr.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/he.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/he.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/hu.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/hu.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/it.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/it.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/ja.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/ja.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/nl.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/nl.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/pl.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/pl.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/pt.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/pt.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/ru.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/ru.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/zh.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/i18n/zh.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-full.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-full.svg"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-full@1x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-full@1x.png"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-full@2x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-full@2x.png"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-round.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-round.png"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-round.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-round.svg"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-round@2x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-round@2x.png"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-skiny.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-skiny.svg"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-skiny@1x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-skiny@1x.png"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-skiny@2x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-composite-lib/images/brand-leaf-skiny@2x.png"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/de.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/de.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/en.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/en.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/es.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/es.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/fr.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/fr.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/he.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/he.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/hu.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/hu.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/it.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/it.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/ja.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/ja.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/nl.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/nl.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/pl.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/pl.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/pt.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/pt.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/ru.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/ru.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/zh.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/i18n/zh.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/images/no-image.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/images/no-image.svg"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/images/sail-away.jpg",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/assets/ngx-lib/images/sail-away.jpg"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/favicon.ico",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/favicon.ico"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/index.html",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/index.html"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/installation.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/installation.js"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/main.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/main.js"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/polyfills.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/polyfills.js"
                        },
                        {
                            "name": "Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/slideshow.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.3/slideshow.js"
                        }
                    ]
                },
                {
                    "AddonUUID": "50062e0c-9967-4ed4-9102-f2bc50602d41", //Pages
                    "AddonVersion": "0.7.22",
                    "Files": [
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/161.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/161.js"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/3rdpartylicenses.txt",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/3rdpartylicenses.txt"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/731.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/731.js"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/973.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/973.js"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/addon-cpi.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/addon-cpi.js"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/addon_blocks.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/addon_blocks.js"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/api.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/api.js"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/i18n/en.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/i18n/en.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-full.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-full.svg"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-full@1x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-full@1x.png"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-full@2x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-full@2x.png"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-round.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-round.png"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-round.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-round.svg"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-round@2x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-round@2x.png"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-skiny.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-skiny.svg"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-skiny@1x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-skiny@1x.png"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-skiny@2x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/images/brand-leaf-skiny@2x.png"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/de.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/de.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/en.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/en.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/es.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/es.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/fr.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/fr.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/he.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/he.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/hu.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/hu.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/it.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/it.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/ja.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/ja.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/nl.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/nl.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/pl.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/pl.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/pt.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/pt.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/ru.ngx-composite-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/ru.ngx-composite-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/zh.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/i18n/zh.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-full.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-full.svg"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-full@1x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-full@1x.png"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-full@2x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-full@2x.png"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-round.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-round.png"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-round.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-round.svg"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-round@2x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-round@2x.png"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-skiny.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-skiny.svg"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-skiny@1x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-skiny@1x.png"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-skiny@2x.png",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-composite-lib/images/brand-leaf-skiny@2x.png"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/de.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/de.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/en.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/en.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/es.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/es.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/fr.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/fr.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/he.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/he.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/hu.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/hu.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/it.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/it.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/ja.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/ja.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/nl.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/nl.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/pl.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/pl.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/pt.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/pt.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/ru.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/ru.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/zh.ngx-lib.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/i18n/zh.ngx-lib.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/images/no-image.svg",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/images/no-image.svg"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/images/sail-away.jpg",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/assets/ngx-lib/images/sail-away.jpg"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/favicon.ico",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/favicon.ico"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/index.html",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/index.html"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/installation.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/installation.js"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/internal_api.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/internal_api.js"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/main.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/main.js"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/page_builder.js",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/page_builder.js"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/template_pages/homepage_blank.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/template_pages/homepage_blank.json"
                        },
                        {
                            "name": "Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/template_pages/homepage_gridy.json",
                            "url": "https://cdn.pepperi.com/Addon/Public/50062e0c-9967-4ed4-9102-f2bc50602d41/0.7.22/template_pages/homepage_gridy.json"
                        }
                    ]
                }
            ]
        }
    }
    
    // s3: S3;
    // createS3ForDebug(): S3 {
    //     const AWS_ACCESS_KEY_ID="XXXXXXXXXXXXXXXXXXXX";
    //     const AWS_SECRET_ACCESS_KEY="XXXXXXXXXXXXXXXXXXXX";
    //     const AWS_SESSION_TOKEN="XXXXXXXXXXXXXXXXXXXX";
    //     return new AWS.S3({
    //         accessKeyId: AWS_ACCESS_KEY_ID,
    //         secretAccessKey: AWS_SECRET_ACCESS_KEY,
    //         sessionToken: AWS_SESSION_TOKEN,
    //         region: 'us-west-2'
    //     });
    // }

    // async getPageFilesToDownload(): Promise<{Addons: BlockFiles[]}> {
    //     const availableBlocks = await this.pagesApiService.getAvailableBlocks();
    //     // Distinct the avilable blocks by addonPublicBaseURL
    //     const distinctBlocks: IBlockLoaderData[] = availableBlocks.reduce((acc, curr) => {
    //         if (!acc.find(block => block.addonPublicBaseURL === curr.addonPublicBaseURL)) {
    //             acc.push(curr);
    //         }
    //         return acc;
    //     }, [] as any);
   
    //     const files = distinctBlocks.map(block => {
    //        return this.getAddonFilesFromS3(block.addonPublicBaseURL, block.relation.AddonUUID, block.addonVersion);
    //     });
    //     // get pages addon files from s3
    //     const cdnUrl = `${this.getCDNBaseURL()}/Addon/Public/${config.AddonUUID}/`;
    //     files.push(this.getAddonFilesFromS3(cdnUrl ,config.AddonUUID, config.AddonVersion));
        
    //     return {
    //       Addons: await Promise.all(files)
    //     };
    // }

    // async getAddonFilesFromS3(cdnBaseURL: string, addonUUID: string, addonVersion: string): Promise<BlockFiles> {
    //     const params = {
    //         Bucket: this.BUCKET_NAME,
    //         Prefix: `Addon/Public/${addonUUID}/${addonVersion}/`
    //     };
    //     // extract host name from base url
    //     const { hostname } = new URL(cdnBaseURL);
    //     const files = await this.s3.listObjects(params).promise();
    //     const filesToDownload = files.Contents?.map(file => {
    //         return {
    //             name: file.Key as string,
    //             url: `https://${hostname}/${file.Key}`
    //         };
    //     });

    //     return {
    //         AddonUUID: addonUUID,
    //         AddonVersion: addonVersion,
    //         Files: filesToDownload || []
    //     };
    // }

    // async downlodBlockFilesFromS3(block: BlockFiles): Promise<any> {      
    //     const filesToDownload = block.Files;
    //     const filesToDownloadPromises = filesToDownload.map(async file => {
    //         const params = {
    //             Bucket: this.BUCKET_NAME,
    //             Key: file.name
    //         };
    //         const data = await this.s3.getObject(params).promise();
    //         return data;
    //     });
    //     const filesToDownloadData = await Promise.all(filesToDownloadPromises);
    //     return filesToDownloadData;
    // } 

    getCDNBaseURL(): string {
        if (this.isProduction()) {
            return "https://cdn.pepperi.com";
        } else {
            return "https://cdn.pepperi.staging.com";
        }
    }   

    isProduction(): boolean {
        const token = jwtDecode(this.authToken) as any;
        const papiBaseUrl = token['pepperi.baseurl'];
        return !papiBaseUrl.includes('staging');    
    }
}
export default FilesService;