// app.js - Universal cPanel Entry Point for Phusion Passenger
const fs = require('fs');
const path = require('path');

if (fs.existsSync(path.join(__dirname, 'server/dist/index.js'))) {
  require('./server/dist/index.js');
} else if (fs.existsSync(path.join(__dirname, 'dist/index.js'))) {
  require('./dist/index.js');
} else {
  console.error('Error: Could not locate server/dist/index.js or dist/index.js');
}
