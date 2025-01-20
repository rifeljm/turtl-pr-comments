const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const readFileAsync = promisify(fs.readFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

function isMatch(filePath, pattern) {
  // Convert gitignore pattern to regex
  const regexPattern = pattern
    // Escape special regex characters except * and /
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    // Convert * to regex equivalent
    .replace(/\*/g, ".*")
    // Handle trailing slash for directories
    .replace(/\/$/g, "/?$");

  const regex = new RegExp(`^${regexPattern}$|^${regexPattern}/|/${regexPattern}$|/${regexPattern}/`);
  return regex.test(filePath);
}

async function getGitignorePatterns(startPath) {
  try {
    const gitignorePath = path.join(startPath, ".gitignore");
    console.log("gitignorePath", gitignorePath);
    const content = await readFileAsync(gitignorePath, "utf8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  } catch (err) {
    return [];
  }
}

async function listDirectories(startPath) {
  const ignorePatterns = await getGitignorePatterns(startPath);
  const directories = [];

  function shouldIgnore(relativePath) {
    // Ignore folders starting with '.'
    if (relativePath.split(path.sep).some((part) => part.startsWith("."))) {
      return true;
    }
    return ignorePatterns.some((pattern) => isMatch(relativePath, pattern));
  }

  async function traverse(currentPath) {
    const relativePath = path.relative(startPath, currentPath);

    // Skip the check for the root directory
    if (relativePath && shouldIgnore(relativePath)) {
      return;
    }

    try {
      const items = await readdirAsync(currentPath);

      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = await statAsync(fullPath);

        if (stat.isDirectory()) {
          const relPath = path.relative(startPath, fullPath);
          if (!shouldIgnore(relPath)) {
            // Only add directories that aren't the root
            if (relPath !== "") {
              directories.push(relPath);
            }
            await traverse(fullPath);
          }
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${currentPath}:`, err);
    }
  }

  await traverse(startPath);
  return directories;
}

module.exports = { listDirectories };
