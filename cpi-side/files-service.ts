import fetch from "node-fetch";
import { BlockFile, BlockFiles } from 'shared'
import fs from "fs";
import jwtDecode from 'jwt-decode';
import config from "../addon.config.json";
import PQueue from 'p-queue';

class FilesService {

    private _pagesFolder = '';
    get pagesFolder() {
        return (async () => {
            if (!this._pagesFolder) {
                this._pagesFolder = await this.getPagesFolder();
            }
            return this._pagesFolder;
        })()
    }

    filesQueue: PQueue;
    constructor() {
        this.filesQueue = new PQueue({ concurrency: 10 });
    }
    async getPagesFolder(): Promise<string> {
        const filesRootDir = await pepperi.files.rootDir();
        const pagesRootDir = `${filesRootDir}/Pages`;  
        if (!fs.existsSync(pagesRootDir)) {
            fs.mkdirSync(pagesRootDir);
        }
        return pagesRootDir;
    }
    
    async downloadFiles(): Promise<any> {
        // rename pages root folder for backup
        const pagesRootDir = await this.pagesFolder;
        const backupFolderName = `${pagesRootDir}_${new Date().getTime()}_backup`;
        this.renameFolderName(pagesRootDir, backupFolderName);
        let filesStatus:any[] = [];
        try {
            // download files
            filesStatus = await this.downloadPagesBlocksFiles();
            // check if there are errors
            if (filesStatus.some(file => file.success === false)) {
                throw new Error('Some files were not downloaded');
            } else {
                // delete backup
                this.deleteFolder(backupFolderName);
            }    
            
        } catch (error) {
            // if there is a backup folder, restore it
            if (fs.existsSync(backupFolderName)) {
                // delete the new pages folder
                this.deleteFolder(pagesRootDir);
                // restore backup
                this.renameFolderName(backupFolderName, pagesRootDir);
            }
            throw error;
            
        }
        return filesStatus;
    }

    private async downloadPagesBlocksFiles(): Promise<any> {
        const pagesRootDir = await this.pagesFolder;
        const addonsFiles = await this.getAddonsClientFiles();
        const flatFiles = this.getFlatFilesList(addonsFiles.Addons);
        console.log(`Downloading ${flatFiles.length} files`);
        let filesToDownloadPromises:any[] = [];
        let filesStatus:any[] = [];
        // download files by adding them to the queue
        // and waiting for all to finish
        await this.filesQueue.addAll(flatFiles.map((file) => {
            return (() => {
                // remove Version from url (section 3)
                // file name looks like:  Addon/<AddonUUID>/<Version>/<FileName> - Addon/Public/f93658be-17b6-4c92-9df3-4e6c7151e038/0.7.2/assets/installation.js
                const sections = file.name.split('/');
                const filePath = `${pagesRootDir}/${sections[0]}/${sections[1]}/${sections[2]}/${sections.slice(4).join('/')}`;
                const fileUrl = `${file.url}`;
                return this.downloadFile(filePath, fileUrl).then(() => {
                    filesStatus.push({
                        name: filePath,
                        url: fileUrl,
                        success: true
                    });
                }).catch((err) => {
                    console.log(err);
                    filesStatus.push({
                        name: filePath,
                        url: fileUrl,
                        success: false,
                    });
                });
            })
        }));
        console.log(`Downloaded ${filesStatus.filter(file => file.success === true).length} files`);
        return filesStatus;
    }

    downloadFile(filePath: string, fileUrl: string): Promise<void> {
        console.log(`Downloading file ${filePath} from ${fileUrl}`);

        return new Promise((resolve, reject) => {
            fetch(fileUrl).then(res => res.buffer()).then(buffer => {
                // write file to disk
                const dir = filePath.substring(0, filePath.lastIndexOf('/'));
                // create dir if needed
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                return fs.promises.writeFile(filePath, buffer);
            }).then(() => {
                console.log(`Downloaded file ${filePath}`);
                resolve();
            }).catch(err => {
                console.log(err);
                reject(err);
            });
        });        
    }

    getFlatFilesList(blocks: BlockFiles[]): BlockFile[] {
        return blocks.map(x => (x.Files && Array.isArray(x.Files)) ? x.Files : []).flat();
    }


    async getAddonsClientFiles(): Promise< { Addons: BlockFiles[]}> {
        const token = await pepperi['auth'].getAccessToken();
        const baseURL = jwtDecode<any>(token)['pepperi.baseurl'];        
        const url = `${baseURL}/addons/api/${config.AddonUUID}/internal_api/get_pages_files_to_download`;
        const files = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });
        
        const filesJson = await files.json();
        if (files.status !== 200) {
            throw new Error(`Error downloading files: ${filesJson.message}`);
        }
        return filesJson;
    }

    renameFolderName(folderPath: string, newFolderPath: string): string {
        if (fs.existsSync(folderPath)) {
            fs.renameSync(folderPath, newFolderPath);
        }
        return newFolderPath;
    }

    async deleteFolder(folderPath: string): Promise<void> {
        // delete if exists
        if (fs.existsSync(folderPath)) {
            fs.rmdirSync(folderPath, { recursive: true });
        }
    }
}
export default FilesService;