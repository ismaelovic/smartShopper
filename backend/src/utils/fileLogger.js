// backend/src/utils/fileLogger.js
const fs = require('fs').promises;
const path = require('path');

const debugDirPath = path.join(__dirname, '../../debug_data'); // Path to debug_data from utils

// Helper function to ensure a directory exists
async function ensureDirectoryExists(directoryPath) {
   try {
       await fs.mkdir(directoryPath, { recursive: true });
       console.log(`Ensured directory exists: ${directoryPath}`);
   } catch (error) {
       if (error.code !== 'EEXIST') {
           console.error(`Error creating directory ${directoryPath}:`, error);
           throw error;
       }
   }
}

// Call this once when the server starts up
async function initializeFileLogger() {
   await ensureDirectoryExists(debugDirPath);
}

async function saveJsonToFile(filenamePrefix, data, identifier = '') {
   const filename = `${filenamePrefix}_${identifier}_${Date.now()}.json`;
   const filePath = path.join(debugDirPath, filename);
   try {
       await fs.writeFile(filePath, JSON.stringify(data, null, 2));
       console.log(`Saved ${filenamePrefix} data to ${filePath}`);
   } catch (writeError) {
       console.error(`Error saving ${filenamePrefix} data to file: ${writeError.message}`);
   }
}

async function saveTextToFile(filenamePrefix, text, identifier = '') {
   const filename = `${filenamePrefix}_${identifier}_${Date.now()}.txt`;
   const filePath = path.join(debugDirPath, filename);
   try {
       await fs.writeFile(filePath, text);
       console.log(`Saved ${filenamePrefix} text to ${filePath}`);
   } catch (writeError) {
       console.error(`Error saving ${filenamePrefix} text to file: ${writeError.message}`);
   }
}

module.exports = {
   initializeFileLogger,
   saveJsonToFile,
   saveTextToFile
};