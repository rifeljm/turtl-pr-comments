const express = require("express");
const cors = require("cors");
const path = require("path");
const { exec } = require("child_process");
const { listDirectories } = require("./listDirs");

const app = express();
const port = 8123;

let dirs;

// Configure CORS with specific options
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

// Enable CORS with options
app.use(cors(corsOptions));

// New route for URL decoding text
app.get("/files/:files", (req, res) => {
  const decodedText = decodeURIComponent(req.params.files);

  try {
    const parsed = JSON.parse(decodedText);

    parsed.forEach((file) => {
      /* Get the directory path without the filename */
      const fileFolder = path.dirname(file);

      const folder = dirs.find((dir) => dir.includes(fileFolder));
      if (folder) {
        const fullPathFile = "./turtl/" + folder + "/" + file.split("/")[file.split("/").length - 1];

        const execCommand = `cursor "${fullPathFile}"`;
        console.log(execCommand);
        exec(execCommand, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error opening file: ${error}`);
            return;
          }
          console.log(`Opened file: ${fullPathFile}`);
        });
      }
    });

    res.json(parsed);
  } catch (e) {
    res.json({ decoded: decodedText });
  }
});

// Function to get current git branch
async function getCurrentBranch() {
  return new Promise((resolve, reject) => {
    exec("git -C ./turtl branch --show-current", (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

let currentBranch = "";

// Function to check git branch and update dirs if changed
async function checkBranchAndUpdate() {
  try {
    const newBranch = await getCurrentBranch();
    if (newBranch !== currentBranch) {
      console.log(`Branch changed from ${currentBranch} to ${newBranch}`);
      currentBranch = newBranch;
      dirs = await listDirectories(path.resolve(".") + "/turtl");
      console.log("Directories updated!");
    }
  } catch (error) {
    console.error("Error checking git branch:", error);
  }
}

// Initial setup
(async () => {
  dirs = await listDirectories(path.resolve(".") + "/turtl");
  currentBranch = await getCurrentBranch();
  // Check every 5 seconds
  setInterval(checkBranchAndUpdate, 5000);
})();

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
