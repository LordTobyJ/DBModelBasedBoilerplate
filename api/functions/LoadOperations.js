
const { ConnectToDBMiddleware } = require('./ConnectToDB');
const fs = require('fs');
const path = require('path');

const LoadOperations = async (app) => {
  const methods = ["GET", "PUT", "POST", "DELETE"];

  for (let i = 0; i < methods.length; i++) {
    const method = methods[i];
    // Read the DB Operations
    const dbFolder = path.join(__dirname, '..', 'autooperations', method);
    const nonDbFolder = path.join(__dirname, '..', 'operations', method);
    // Open the operations with a DB Connection
    await fs.readdir(dbFolder, (err, files) => {
      for(let f = 0; f < files.length; f++) {
        const file = files[f]
        if (!file.endsWith('.js')) return;
        const pathName = file.replace(".js","");
        console.log(`Setting up /api/db/${pathName}`)
        app[method.toLowerCase()](`/api/db/${pathName}`, ConnectToDBMiddleware, require(path.join(dbFolder, file)));
      }
    });
  
    // Open the operations without a DB Connection
    await fs.readdir(nonDbFolder, (err, files) => {
      for(let f = 0; f < files.length; f++) {
        const file = files[f]
        if (!file.endsWith('.js')) return;
        const pathName = file.replace(".js","");
        console.log(`Setting up /api/${pathName}`)
        app[method.toLowerCase()](`/api/${pathName}`, require(path.join(nonDbFolder, file)));
      }
    });
  };

  console.log("Operations Loaded");
}

module.exports = LoadOperations;