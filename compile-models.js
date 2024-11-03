
const fs = require('fs');
const path = require('path');
const { GeneralDataGenerator, EachFileDataGenerator } = require('./DataGenerator');

const modelsFolder = path.join(__dirname, "db-models");

console.log("Compiling Models");

const generalGenerator = new GeneralDataGenerator();

// Initialise Files
fs.appendFileSync("db/init-db.sh", generalGenerator.db.create);
fs.appendFileSync(`frontend/src/APIHandler.js`, generalGenerator.frontend.apihandler);
  
fs.readdir(modelsFolder, (err, files) => {
  for(let f = 0; f < files.length; f++) {
    const file = files[f]

    if (!file.endsWith('.json')) return;

    const fileGenerator = new EachFileDataGenerator(modelsFolder, file);

    // Compile the init-db.sh
    fs.appendFileSync("db/init-db.sh", fileGenerator.db.generateTable);

    // Add the Entries for the Backend API
    fs.appendFileSync(`api/autooperations/GET/${fileGenerator.tableName}.js`, fileGenerator.backend.get);
    fs.appendFileSync(`api/autooperations/GET/${fileGenerator.tableName}ById.js`, fileGenerator.backend.getById);
    fs.appendFileSync(`api/autooperations/PUT/${fileGenerator.tableName}.js`, fileGenerator.backend.update);
    fs.appendFileSync(`api/autooperations/POST/${fileGenerator.tableName}.js`, fileGenerator.backend.create);
    fs.appendFileSync(`api/autooperations/DELETE/${fileGenerator.tableName}.js`, fileGenerator.backend.delete);

    // Add the Entries for the Frontend API
    fs.appendFileSync(`frontend/src/APIHandler.js`, fileGenerator.frontend.get);
    fs.appendFileSync(`frontend/src/APIHandler.js`, fileGenerator.frontend.getById);
    fs.appendFileSync(`frontend/src/APIHandler.js`, fileGenerator.frontend.update);
    fs.appendFileSync(`frontend/src/APIHandler.js`, fileGenerator.frontend.create);
    fs.appendFileSync(`frontend/src/APIHandler.js`, fileGenerator.frontend.delete);

  }
});

console.log("Finished Compiling Models");

