import fetch from "node-fetch";
import { BlockFile, BlockFiles } from "../shared/pages.model";
import fs from "fs";
class FilesService {

    async downloadFiles(): Promise<any> {
        // rename pages root folder for backup
        const filesRootDir = await pepperi["files"].rootDir();
        const pagesRootDir = `${filesRootDir}/Pages`;  
        const backupFolderName = `${pagesRootDir}_${new Date().getTime()}_backup`;
        this.renameFolderName(pagesRootDir, backupFolderName);
        // download files
        const filesStatus = await this.downloadPagesBlocksFiles();
        // check if there are errors
        if (filesStatus.some(file => file.success === false)) {
            // delete the new pages folder
            this.deleteFolder(pagesRootDir);
            // restore backup
            this.renameFolderName(backupFolderName, pagesRootDir);
            throw new Error('Some files were not downloaded');
        } else {
            // delete backup
            this.deleteFolder(backupFolderName);
        }    
        return filesStatus;
    }

    private async downloadPagesBlocksFiles(): Promise<any> {
        const filesRootDir = await pepperi["files"].rootDir();
        const pagesRootDir = `${filesRootDir}/Pages`;
        const addonsFiles = await this.getAddonsClientFiles();
        const flatFiles = this.getFlatFilesList(addonsFiles.Addons);
        console.log(`Downloading ${flatFiles.length} files`);
        let filesToDownloadPromises:any[] = [];
        let filesStatus:any[] = [];
        // interate flat files and download 10 files each iteration
        for (let i = 0; i < flatFiles.length; i += 10) {
            const endBulckIndex = i + 10 > flatFiles.length ? undefined : i + 10; // If end is undefined, then the slice extends to the end of the array (From slice docs).
            console.log(`Downloading files from ${i} to ${endBulckIndex}`);
            const filesToDownload = flatFiles.slice(i, endBulckIndex);
            filesToDownloadPromises.push(filesToDownload.map(async (file) => {
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
            }));
        }
        // wait for download promises to finish
        await Promise.all([].concat(...filesToDownloadPromises));
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
        let flatFilesList: BlockFile[] = [];
        blocks.forEach(block => {
            if (block.Files && Array.isArray(block.Files)) {
                flatFilesList = flatFilesList.concat(block.Files);
            }
        });
        return flatFilesList;
    }


    async getAddonsClientFiles(): Promise< { Addons: BlockFiles[]}> {
        const url = 'http://localhost:4700/internal_api/get_pages_files_to_download'; // TODO will be changed to papi
        const token = await pepperi['auth'].getAccessToken();
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