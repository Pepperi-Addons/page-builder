import { Client } from "@pepperi-addons/debug-server";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import AWS, { S3 } from "aws-sdk";
import { PagesApiService } from "./pages-api.service";
import { BlockFiles, IBlockLoaderData } from '../shared/pages.model';
import config from '../addon.config.json';
import jwtDecode from 'jwt-decode';
class FilesService {

    BUCKET_NAME = 'pepperi-storage-production';

    papiClient: PapiClient;
    addonUUID: string;
    pagesApiService: PagesApiService;
    s3: S3;
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
        this.s3 = new AWS.S3();
        // only for debug        
        this.s3 = this.createS3ForDebug();
        this.authToken = client.OAuthAccessToken;
    }

    createS3ForDebug(): S3 {
        const AWS_ACCESS_KEY_ID="ASIAQKPEPN2ZXCZSHB7Y"
        const AWS_SECRET_ACCESS_KEY="2tx8eBt549eHzj51w8GUmO5Zn12PsmUaylX/bZR+"
        const AWS_SESSION_TOKEN="IQoJb3JpZ2luX2VjEAkaDGV1LWNlbnRyYWwtMSJIMEYCIQCRO+CkmDrJ01Qt1xSzrV78rvkFR7jtUvmUwfH0yL8tQAIhALGCY7Vz0b/rgUQ/ejsguDWlPNVD4NdUBVUgFbIBH8LUKpIDCEIQABoMMDIyNDkwODY5NDI3IgzLGy1yLjeAMrR4CnUq7wIBVC2I6hYDPORu7y6t3ogYac6sk3To10OHONezu7b1fBlShc2xi8bDNz6kZADvh09z+k2aKD9fCGes0jhzaXW2FPCu3g/AStM/CQJtk4OWWWKS89HbQtY+6skV56kI54DEE2DZxXnTO/H7gwvOPMmxgcewAhiODlid02duS1LKlIKz+fURLXutse+61BgGLk29u8orYsJHADhk5pljtoQIIJbOgoviQGcoUk6Y89WpE7v1QH/7NUsODY3gw1BCrvnYQI9egNQvy3mm4Yh2jUyQUMrsrGDEIv7T1SdcWtmMbv+zmeRJaPU+/LSySwHkhRNEbd7F3z375JurY5/ZLWQb9iMtM49ULwMmZ1EGfXhZEBNl446Tenxyg+qwcZLZmJ1Vs8o6FicifkZML1qX3gr/csELlEgtyIZwPcsrytXeXOFlzqbmRiDZreUOQrrUwJ1X9e3edJ9cGvjYxvHFg4cGwo25qe7ObF/Urun5/D29MJrNr5YGOqUBYyVPg+07Tv3fvk+5MUCT1Z4iry30pgPgLSuSfHLaZV4/7N5Bl3KRaM9TWdZiSPKj4HvE2El8abYwxeK8/FkTl++jlNbEvFGy/NWnjtQzbscVZOgjYQboCSHej2UgsZazq7iqrd6++uny3NQpOwR3FK6mFMMeqPlFAwrEJYr2ShARZ2ILkt6ycGnBzqTRiceX4PZ/WDGnPnNDgl8yNoF9ydFBOaDd"      
        
        return new AWS.S3({
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
            sessionToken: AWS_SESSION_TOKEN,
            region: 'us-west-2'
        });
    }
    async getPageFilesToDownload(): Promise<{Addons: BlockFiles[]}> {
        const availableBlocks = await this.pagesApiService.getAvailableBlocks();
        // Distinct the avilable blocks by addonPublicBaseURL
        const distinctBlocks: IBlockLoaderData[] = availableBlocks.reduce((acc, curr) => {
            if (!acc.find(block => block.addonPublicBaseURL === curr.addonPublicBaseURL)) {
                acc.push(curr);
            }
            return acc;
        }, [] as any);
   
        const files = distinctBlocks.map(block => {
           return this.getAddonFilesFromS3(block.addonPublicBaseURL, block.relation.AddonUUID, block.addonVersion);
        });
        // get pages addon files from s3
        const cdnUrl = `${this.getCDNBaseURL()}/Addon/Public/${config.AddonUUID}/`;
        files.push(this.getAddonFilesFromS3(cdnUrl ,config.AddonUUID, config.AddonVersion));
        
        return {
          Addons: await Promise.all(files)
        };
    }

    async getAddonFilesFromS3(cdnBaseURL: string, addonUUID: string, addonVersion: string): Promise<BlockFiles> {
        const params = {
            Bucket: this.BUCKET_NAME,
            Prefix: `Addon/Public/${addonUUID}/${addonVersion}/`
        };
        // extract host name from base url
        const { hostname } = new URL(cdnBaseURL);
        const files = await this.s3.listObjects(params).promise();
        const filesToDownload = files.Contents?.map(file => {
            return {
                name: file.Key as string,
                url: `https://${hostname}/${file.Key}`
            };
        });

        return {
            AddonUUID: addonUUID,
            AddonVersion: addonVersion,
            Files: filesToDownload || []
        };
    }

    async downlodBlockFilesFromS3(block: BlockFiles): Promise<any> {      
        const filesToDownload = block.Files;
        const filesToDownloadPromises = filesToDownload.map(async file => {
            const params = {
                Bucket: this.BUCKET_NAME,
                Key: file.name
            };
            const data = await this.s3.getObject(params).promise();
            return data;
        });
        const filesToDownloadData = await Promise.all(filesToDownloadPromises);
        return filesToDownloadData;
    } 

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