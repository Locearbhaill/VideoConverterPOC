const express = require("express");

const ffmpeg = require("fluent-ffmpeg");

const bodyParser = require("body-parser");

const fs = require("fs");

const fileUpload = require("express-fileupload");
const { Console } = require("console");

// const exif = require("exiftool"); // This is depreceated

const app = express();

app.set('view engine', 'ejs'); // This is so you can dynamically change html view

const PORT = process.env.PORT || 5000

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json(), express.static(__dirname )); // the added .static call makes the html page load first
                                                        // but it also allows express to view the images placed in 
                                                        // the /fragments file. Otherwise express is not allowed access.

//support parsing of application/x-www-form-urlencoded post data

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

let file;

let uploadedBool = false;

ffmpeg.setFfmpegPath("C:/ffmpeg-20200818-1c7e55d-win64-static/bin/ffmpeg.exe");

ffmpeg.setFfprobePath("C:/ffmpeg-20200818-1c7e55d-win64-static/bin/ffprobe.exe");

console.log(ffmpeg);

app.get("/", (req, res) => {
  res.render('index.ejs', { fileUpNameDisplay: "Please Upload Video", validationData: " Please Upload Video ", fileNameDisplay: "" }); // This way you do not need to pass full path
  // as ejs will by default look for ejs files in "views" folder
});

//Helper function for name set/get
function nameSetterGetter(s) { //For passing file name through the system
  if (s) {
    file = s; // Set if given file
  }
  else {
    return file; // return if called without parameter
  }
};

//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------
// The below segment is used to generate gif preview, /upload is the trigger.

const getVideoInfoDuration = (inputPath) => { // function to get video duration
  return new Promise((resolve, reject) => {
    return ffmpeg.ffprobe(inputPath, (err, videoInfo) => {
      if (err) return reject(err);

      const { duration, size } = videoInfo.format; // format contains duration
      if (videoInfo) {

        return resolve({
          size,
          durationInSeconds: Math.floor(duration), 
        });
      }
      else {
        reject(); // Needed otherwise you'll have a depreceated warning about not catching promises
      }
    });
  });
};

const getRandomIntegerInRange = (min, max) => { // self explanitory

  const minInt = Math.ceil(min);
  const maxInt = Math.floor(max);

  return Math.floor(Math.random() * (maxInt - minInt + 1) + minInt); 
};

// Main driver of fragment creation below
const createFragmentPreview = async (inputPath, outputPath, fragmentDurationInSeconds = 4) => {
  return new Promise(async (resolve, reject) => {

    const {durationInSeconds: videoDurationInSeconds} = await getVideoInfoDuration(inputPath, );

    const startTimeInSeconds = getStartTimeInSeconds( videoDurationInSeconds, fragmentDurationInSeconds,);

    return ffmpeg() //build ffmpeg command
      .input(inputPath)
      .inputOptions([`-ss ${startTimeInSeconds}`])
      .outputOptions([`-t ${fragmentDurationInSeconds}`])
      .noAudio()
      .output(outputPath+"gifOutput.gif") //need to specify "gif" here. mp4 may work also
      .on('end', resolve)
      .on('error', reject)
      .run(); 
  });
};

const getStartTimeInSeconds = (videoDurationInSeconds, fragmentDurationInSeconds) => {
  // Subtracting the fragment duration to ensure that start time + fragment duration will be les than video duration
  const safeVideoDurationInSeconds = videoDurationInSeconds - fragmentDurationInSeconds;

  // Catch for if fragment is longer than video duration
  if (safeVideoDurationInSeconds <=0 ) {
    return 0;
  }
  return getRandomIntegerInRange (0.25* safeVideoDurationInSeconds, 0.75 * safeVideoDurationInSeconds);
};


//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------

//Display filters on html, simple iteration through the filter output object
app.post("/filters", (req, res) => {

  var stringArray = [];
  var stringDisplay = "";
  ffmpeg.getAvailableFilters(function (err, filters) {
    var data = filters;
    console.log(data);
    for (var key in filters) {
      if (filters.hasOwnProperty(key)) {
        stringArray.push("Name of filter = ", key);
        var valueSub = filters[key];
        for (subKey in valueSub) {
          if (valueSub.hasOwnProperty) {
            var value = valueSub[subKey];
            switch (subKey) {
              case "description":
                stringArray.push("Description = ", value);
                break;
              case "input":
                stringArray.push("Input = ", value);
                break;
              case "output":
                stringArray.push("Output = ", value);
                break;
            }
          }
        }
        stringArray.push("___________________", "___________________");
      }
    }

    for (var i = 0; i < stringArray.length; i++) {
      if (i % 2 == 0 && i > 0) {
        stringDisplay = stringDisplay + "\n"; // Every second iteration add newline for formatting
      }
      stringDisplay = stringDisplay + stringArray[i];
    }

    console.log("Available filters:");
    // console.dir(filters); 
    console.log(stringDisplay);
    if (file == null) {
      res.render('index.ejs', { fileUpNameDisplay: "", validationData: stringDisplay, fileNameDisplay: "" });
    }
    else {
      res.render('index.ejs', { fileUpNameDisplay: file["name"], validationData: stringDisplay, fileNameDisplay: "" });
    }
  });
});
// This snippet above is used to output ffmpeg's filter options.

//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------

app.post("/upload", (req, res) => {

  let file = req.files.file;
  nameSetterGetter(file);

  file.mv("tmp/" + file.name, function (err) { //filed moved to /tmp
    if (err) return res.sendStatus(500).send(err);
    console.log("File Uploaded successfully");
  });

  uploadedBool = true;

  var fragment = createFragmentPreview("tmp/" + file.name, "fragments/", 4);
  // using this above code to attempt to run the create preview

  res.render('index.ejs', { fileUpNameDisplay: file["name"], validationData: "", fileNameDisplay: "File Name = " + file["name"] }); // Update frontend with created info



});

//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------

// app.get("/", (req, res) => {
//   res.sendFile(__dirname + "/index.html");
// });

// Validation scrapes metadata of the file
app.post("/validate", (req, res) => {
  //-------------------------------------------------------------------------------|
  //TODO: Build out dynamic page builder -> DONE                                   |
  // The idea of hte dynamic page builder is to be able to output whatever the     |
  // contents of the metadata to html readable format for the user. The below      |
  // ffmpeg.ffprobe works to output to command line, now I will be taking that     |
  // List of sets and I will be building a function here to parse that info.       |
  //-------------------------------------------------------------------------------|

  // let file = req.files.file;
  let file = nameSetterGetter();

  var htmlArray = []; // Array for holding items to be combined into a string

  // file.mv("tmp/" + file.name, function (err) { //filed moved to /tmp
  //   if (err) return res.sendStatus(500).send(err); 
  //   console.log("File Uploaded successfully");
  // });

  ffmpeg.ffprobe("tmp/" + file.name, function (err, metadata) {
    if (err) throw err;
    // console.log(metadata.streams);
    console.log("File name = ", file["name"]);
    var data = metadata.streams;
    for (var key in data) { // iterate through object at high level
      if (data.hasOwnProperty(key)) {
        var valueSub = data[key]; // iterate through each sub object
        for (var subKey in valueSub) {
          if (valueSub.hasOwnProperty) {
            var value = valueSub[subKey]; // set value for output 
            switch (subKey) { // This switch builds the string which will be displayed in html
              case "codec_long_name":
                console.log("Codec name = ", value); //logs just to check all is going well
                htmlArray.push("Codec name = ", value);
                break;

              case "width":
                console.log("Width = ", value);
                htmlArray.push("Width = ", value);
                break;

              case "height":
                console.log("Heigth = ", value);
                htmlArray.push("Heigth = ", value);
                break;

              case "display_aspect_ratio":
                console.log("Aspect Ratio = ", value);
                htmlArray.push("Aspect Ratio = ", value);
                break;

              case "codec_type":
                console.log("Codec Type = ", value);
                htmlArray.push("Codec Type = ", value);
                break;

              case "avg_frame_rate":
                console.log("Average frames /s = ", value);
                htmlArray.push("Average frames /s = ", value);
                break;
              case "duration":
                console.log("Time in seconds = ", value);
                htmlArray.push("Time in seconds = ", value);
                break;

              // default :
              //   console.log("Information not found");
              //   break;
            }
            // console.log("Working: " , value);
          }
        }
        // console.log("Working: " , value);
      }
    }
    console.log("_____________________________");
    var htmlString = "";
    for (var i = 0; i < htmlArray.length; i++) {
      if (i % 2 == 0 && i > 0) {
        htmlString = htmlString + "\n"; // Every second iteration add newline for formatting
      }
      htmlString = htmlString + htmlArray[i];
    }
    // console.log(htmlString);

    res.render('index.ejs', {
      validationData: htmlString,
      fileNameDisplay: "File Name = " + file["name"],
      fileUpNameDisplay: "File Name = " + file["name"]
    }); // Update frontend with created info

    fs.unlink("tmp/" + file.name, function (err) { //remove from tmp 
      if (err) throw err;
      console.log("File deleted");
    });
  });
});

//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------

//Conversion logic
app.post("/convert", (req, res) => {

  file = nameSetterGetter();
  let resolutionSelected;
  let to = req.body.to; // name = "to" can be seen in the html
  let toRes = req.body.toRes;
  // let file = req.files.file;
  let fileName = `output.${to}`;
  let resName = `resolution.${toRes}`;
  console.log("Resolution selected: ", resName);
  console.log("Filetype selected: ", to);
  console.log("File information to follow: ");
  console.log(file);

  // file.mv("tmp/" + file.name, function (err) { //filed moved to /tmp
  //   if (err) return res.sendStatus(500).send(err); 
  //   console.log("File Uploaded successfully");
  // });

  // ffmpeg.ffprobe("tmp/" + file.name, function(err, metadata) {
  //   if (err) throw err;
  //   console.dir(metadata);
  // });
  //---------------
  // fs.readFile("tmp/" + file.name, function (err, data) {
  //   if (err) throw err;
  //   exif.metadata(data, function (err, metadata) {
  //     if (err) throw err;
  //     console.log("File metadata to follow: ")
  //     console.log(metadata);
  //   });
  // }); // ------------- This section was trying to read metadata
  // However the problem is that the library is defunct and not updated in 6 years. Errors galore.
  //Switch goes here
  // TODO: Restructure the switch so that repeating code is minimised.
  switch (toRes) {
    case 'No Resolution change':
      console.log("This should be here only if resolution didn't fail");
      ffmpeg("tmp/" + file.name) //build ffmpeg command
        .withOutputFormat(to) //select output with help from html selector
        .on("progress", function (progress) { //print progress
          console.log("Processing: " + progress.timemark);
        })
        .on("end", function (stdout, stderr) { // on "event" do -> 
          console.log("Finished");
          res.download(__dirname + fileName, function (err) { //throw download to browser
            if (err) throw err;

            fs.unlink(__dirname + fileName, function (err) { //remove elsewhere
              if (err) throw err;
              console.log("File deleted");
            });
          });
          fs.unlink("tmp/" + file.name, function (err) { // remove in case of unreached code
            if (err) throw err;
            console.log("File deleted");
          });
        })
        .on("error", function (err) {
          console.log("an error happened: " + err.message);
          fs.unlink("tmp/" + file.name, function (err) { // remove in case of error
            if (err) throw err;
            console.log("File deleted");
          });
        })
        .saveToFile(__dirname + fileName);
      break; // break must be here otherwise next case will run
    case '640x480': // 
      resolutionSelected = '640x?'; // Set resolution for the output size
      break;
    case '320x200':
      resolutionSelected = '320x?';
      break;
    case '1280x720':
      resolutionSelected = '1280x?';
      break;
    case '1920x1080':
      resolutionSelected = '1920x?';
      break;
    default:
      console.log("Failed to select resolution");
  } // This one is the end of the switch 

  ffmpeg("tmp/" + file.name) //build ffmpeg command
    .withOutputFormat(to)
    .size(`${resolutionSelected}`) // Apply resolution
    .on("progress", function (progress) {
      console.log("Processing: " + progress.timemark);
    })
    .on("end", function (stdout, stderr) {
      console.log("Finished");
      res.download(__dirname + fileName, function (err) {
        if (err) throw err;

        fs.unlink(__dirname + fileName, function (err) {
          if (err) throw err;
          console.log("File deleted");
        });
      });
      fs.unlink("tmp/" + file.name, function (err) {
        if (err) throw err;
        console.log("File deleted");
      });
    })
    .on("error", function (err) {
      console.log("an error happened: " + err.message);
      fs.unlink("tmp/" + file.name, function (err) {
        if (err) throw err;
        console.log("File deleted");
      });
    })
    .saveToFile(__dirname + fileName);
});

//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------

// Video filter Logic
app.post("/videofilter", (req, res) => {
  //TODO: Video filter options logic -> DONE |
  //TODO: Add more filters
  //-----------------------------------------|
  file = nameSetterGetter();
  let toEffect;
  let effect = req.body.effect; // name = "to" can be seen in the html
  let fileName; // This needs to be set on a case by case
  console.log("File information to follow: ");
  console.log(file);

  switch (effect) {
    case 'Horizontal Flip(Left-Right)':
      fileName = `hflipped${file.name}`;
      console.log("Adding Effect Horizontal Flip");
      toEffect = 'hflip'
      break; // break must be here otherwise next case will run
    case 'Vertical Flip(Top-Bottom)':
      fileName = `vflipped${file.name}`;
      console.log("Adding Effect Vertical Flip");
      toEffect = 'vflip'
      break;

  }
  ffmpeg("tmp/" + file.name) //build ffmpeg command
    .videoFilters(`${toEffect}`) //select output with help from html selector
    .on("progress", function (progress) { //print progress
      console.log("Processing: " + progress.timemark);
    })
    .on("end", function (stdout, stderr) { // on "event" do -> 
      console.log("Finished");
      res.download(__dirname + fileName, function (err) { //throw download to browser
        if (err) throw err;

        fs.unlink(__dirname + fileName, function (err) { //remove elsewhere
          if (err) throw err;
          console.log("File deleted");
        });
      });
      fs.unlink("tmp/" + file.name, function (err) { // remove in case of unreached code
        if (err) throw err;
        console.log("File deleted");
      });
    })
    .on("error", function (err) {
      console.log("an error happened: " + err.message);
      fs.unlink("tmp/" + file.name, function (err) { // remove in case of error
        if (err) throw err;
        console.log("File deleted");
      });
    })
    .saveToFile(__dirname + fileName);
});

//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------

// Audio filter Logic
app.post("/audiofilter", (req, res) => {
  //TODO: Audio filter options logic

  file = nameSetterGetter();
  let toEffect;
  let effect = req.body.effect; // name = "to" can be seen in the html
  let fileName; // This needs to be set on a case by case
  console.log("File information to follow: ");
  console.log(file);

  switch (effect) {
    case 'Fade in and out':
      fileName = `audioFade${file.name}`;
      console.log("Adding Effect Audio Fade");
      toEffect = 'afade'
      break; // break must be here otherwise next case will run
    case 'Echo':
      fileName = `audioEcho${file.name}`;
      console.log("Adding Effect Audio Echo");
      toEffect = 'aecho'
      break;

  }
  ffmpeg("tmp/" + file.name) //build ffmpeg command
    .audioFilters(`${toEffect}`) //select output with help from html selector
    .on("progress", function (progress) { //print progress
      console.log("Processing: " + progress.timemark);
    })
    .on("end", function (stdout, stderr) { // on "event" do -> 
      console.log("Finished");
      res.download(__dirname + fileName, function (err) { //throw download to browser
        if (err) throw err;

        fs.unlink(__dirname + fileName, function (err) { //remove elsewhere
          if (err) throw err;
          console.log("File deleted");
        });
      });
      fs.unlink("tmp/" + file.name, function (err) { // remove in case of unreached code
        if (err) throw err;
        console.log("File deleted");
      });
    })
    .on("error", function (err) {
      console.log("an error happened: " + err.message);
      fs.unlink("tmp/" + file.name, function (err) { // remove in case of error
        if (err) throw err;
        console.log("File deleted");
      });
    })
    .saveToFile(__dirname + fileName);
});

app.listen(PORT);
