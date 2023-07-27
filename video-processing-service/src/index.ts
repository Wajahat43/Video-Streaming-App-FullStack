import express from 'express';
import ffmpeg from 'fluent-ffmpeg';

const app = express();
//Tell express to use json as body parser
app.use(express.json())


app.post('/process-video', (req, res) => {
    //Getting path of input video
    const inputFilePath = req.body.inputFilePath;
    //Getting path of output video
    const outputFilePath = req.body.outputFilePath;

    //checking if input and output file paths are provided
    if (!inputFilePath || !outputFilePath) {
        let missingFiles = [];
        if (!inputFilePath){
            missingFiles.push( "Input File Path");
        }
        if (!outputFilePath){
            missingFiles.push("Output File Path");
        }

        let missingFilesStr = missingFiles.join(" and ");
        res.status(400).send({
            error: `Bad Request`,
            message: `Missing ${missingFilesStr}`
        });
    }


    //Creating ffmpeg command
    ffmpeg(inputFilePath)
        .outputOptions("-vf","scale = -1:360p") //setting output video resolution to 360p
        .on('end', () => {      //when processing is finished
            console.log('Processing finished !');
            res.status(200).send({
                message: `Processing finished !`
            });
        })
        .on('error', (err) => { //when processing is finished with error
            console.log(`Error ${err.message}`);
            res.status(500).send({
                error: `Internal Server Error`,
                message: `Error: ${err.message}`
            });
        })
        .save(outputFilePath); //saving output video to output file path

    }
);

const PORT = process.env.port || 3000; //Take the port from environment variable or use 2000 as default (important for deployment)

app.listen(PORT, () => {
    console.log(`⚡️[Video Processing Service]: listening at http://localhost:${PORT}`);
    }
);