// app.js - Universal Entry Point
const fs = require('fs');
const path = require('path');

let serverApp;
const serverDistPath = path.join(__dirname, 'server/dist/index.js');
const rootDistPath = path.join(__dirname, 'dist/index.js');

if (fs.existsSync(serverDistPath)) {
  serverApp = require(serverDistPath);
} else if (fs.existsSync(rootDistPath)) {
  serverApp = require(rootDistPath);
} else {
  console.error('Error: Could not locate server/dist/index.js or dist/index.js');
}

module.exports = serverApp && serverApp.default ? serverApp.default : serverApp;

