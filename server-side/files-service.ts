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
            "Addons": []
        };
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