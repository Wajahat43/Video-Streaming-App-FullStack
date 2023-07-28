import {Storage} from "@google-cloud/storage";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";


const storage = new Storage();

const rawVideoBucketName = "waj-yt-video-streaming-raw";
const processedVideoBucketName = "waj-yt-video-streaming-processed";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";

/**
 * Creates directories for raw and processed videos
 */

export function setUpDirecotries(){
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);

}

/**
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}
 * @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}
 * @returns A promise that resolves when video has been converted.
 */
export function convertVideo(rawVideoName: string, processedVideoName: string){
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)                      //combine video and directory path
            .outputOptions("-vf", "scale= -1:360")                          //convert video to 360p
            .on("end", () => {
                console.log("Video processing finished");
                resolve();

            })      //log when video processing is finished
            .on("error", (err) => {
                console.log(err);
                reject(err);
            })      //log error if there is one
            .save(`${localProcessedVideoPath}/${processedVideoName}`)       // save to file

    })
}


/**
 * 
 * @param filename - The name of the file to download from {@link rawVideoBucketName} bucket
 * into {@link localRawVideoPath} folder.
 * @returns A promise that resolves when video has been downloaded.
 */
export async function downloadRawVideo(filename: string){
    //await waits for the video to be downloaded before moving on (that's why it's async)
    await storage.bucket(rawVideoBucketName)            
        .file(filename)
        .download({destination: `${localRawVideoPath}/${filename}`});
    
    console.log(
        `gs://${rawVideoBucketName}/${filename} downloaded to ${localRawVideoPath}/${filename}`
    );
}

/**
 * 
 * @param filename - The name of the file to upload to {@link processedVideoBucketName} bucket
 * from {@link localProcessedVideoPath} folder.
 * @returns A promise that resolves when video has been uploaded.
 */
export async function uploadProcessedVideo(filename: string){
    const bucket = storage.bucket(processedVideoBucketName);

    await bucket.upload(`${localProcessedVideoPath}/${filename}`, {
        destination: filename,
    });

    await bucket.file(filename).makePublic();           //making video public
    console.log(
        `${filename} uploaded to gs://${processedVideoBucketName}/${filename}`
    );
    
}

/**
 * 
 * @param filePath - The path of the file to delete
 * @returns A promise that resolves when video has been deleted.
 */
function deleteFile(filePath: string){
    return new Promise<void>((resolve, reject) => {
        if (!fs.existsSync(filePath)){
            console.log(`File ${filePath} does not exist, skipping delete`);
            reject(`File ${filePath} does not exist.`);
        }
        else{
            fs.unlink(filePath, (err) => {
                if(err){
                    console.log(`Failed to delete ${err}`);
                    reject(err);
                }
                else{
                    console.log(`Deleted file ${filePath}`);
                    resolve();
            }
        })
        } 
    })

}

/**
 * 
 * @param rawVideoName Raw video name to delete from {@link localRawVideoPath}
 * @param processedVideoName Processed video name to delete from {@link localProcessedVideoPath}
 * @returns A promise that resolves when video has been deleted.
 */
export function cleanUp(rawVideoName: string, processedVideoName: string){
    deleteFile(`${localRawVideoPath}/${rawVideoName}`),
    deleteFile(`${localProcessedVideoPath}/${processedVideoName}`)
}

/**
 * 
 * @param filePath - The path of the directory to create
 * If directory already exists, does nothing, otherwise creates it.
 * 
 */
function ensureDirectoryExistence(filePath: string){
    
    if (!fs.existsSync(filePath)){
        fs.mkdirSync(filePath, {recursive: true});
        console.log(`Created directory ${filePath}`);
    }
}