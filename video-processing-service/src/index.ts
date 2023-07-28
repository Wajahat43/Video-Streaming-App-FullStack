import express from 'express';

import { cleanUp, convertVideo, downloadRawVideo, setUpDirecotries, uploadProcessedVideo } from './storage';

//Setting up directories
setUpDirecotries();

const app = express();
//Tell express to use json as body parser
app.use(express.json())


app.post('/process-video', async(req, res) => {

    //Getting the bucket and filename from cloud pub/sub message
    let data;
    try{
        const message = Buffer.from(req.body.message.data, 'base64').toString("utf8");
        data = JSON.parse(message);

        if (!data.name){
            throw new Error("Invalid message payload received");
        }
    } catch (err){
        console.error(err);
        return res.status(400).send("Bad Request: missing filename.");
    }

    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;

    //Download the raw video from the bucket
    await downloadRawVideo(inputFileName)

    //converting the video
    try{
        await convertVideo(inputFileName, outputFileName);
    } catch(err){
        await cleanUp(inputFileName, outputFileName);
        console.error(err);
        return res.status(500).send("Internal Server Error: video processing failed");

    }
    

    //uploading the processed video to the bucket
    await uploadProcessedVideo(outputFileName);
    await cleanUp(inputFileName, outputFileName);

    return res.status(200).send("Video processed successfully");    
});

const PORT = process.env.port || 3000; //Take the port from environment variable or use 2000 as default (important for deployment)

app.listen(PORT, () => {
    console.log(`⚡️[Video Processing Service]: listening at http://localhost:${PORT}`);
    }
);