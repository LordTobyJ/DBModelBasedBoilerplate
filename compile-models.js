
const fs = require('fs');
const path = require('path');

const modelsFolder = path.join(__dirname, "db-models");
console.log("Compiling Models");

// Initialise DB Initalisation File
fs.appendFileSync("db/init-db.sh", `# bin/bash
# WARNING: This File is Auto-Generated, and Will be Rebuilt on Every Deployment

psql -U $POSTGRES_USER -c "CREATE DATABASE $POSTGRES_DB;"
psql -U $POSTGRES_DB -d $POSTGRES_DB -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"
`)

// Add the General Request Handler
fs.appendFileSync(`frontend/src/APIHandler.js`, `
// WARNING: This File is Auto-Generated, and Will be Rebuilt on Every Deployment
  const RequestFromAPI = async (endpoint, method, data) => {
  const headers={"Content-Type": "application/json"};

  if (method !== "GET") 
    return await fetch(\`\${endpoint}\`, { method, headers, body: JSON.stringify(data)})

  if (Object.keys(data).length == 0)
    return await fetch (\`\${endpoint}\`, {method, headers})

  const params = Object.entries(data).map((kv) => kv.join("=")).join("&");

  return await fetch (\`\${endpoint}?\$\{params}\`, {method, headers})
}
`)
  
fs.readdir(modelsFolder, (err, files) => {
  for(let f = 0; f < files.length; f++) {
    const file = files[f]
    if (!file.endsWith('.json')) return;

    // Compile the init-db.sh
    const data = Object.entries(JSON.parse(fs.readFileSync(path.join(modelsFolder, file))));

    fs.appendFileSync("db/init-db.sh", `psql -U $POSTGRES_DB -d $POSTGRES_DB -c "\n
      CREATE TABLE IF NOT EXISTS ${file.replace(".json", "")} (\n`);
    for (let i = 0; i < data.length; i++) 
    {
      const isLast = i == data.length - 1;
      const columnName = data[i][0];
      const columnValue = data[i][1].join(" ");
      fs.appendFileSync("db/init-db.sh", `    ${columnName} ${columnValue}${isLast ? "" : ","}\n`)
    }
    fs.appendFileSync("db/init-db.sh", `);"`);

    const tableName = file.replace(".json","");
    const primaryKey = data.reduce((json) => json.filter((col) => col[1] && col[1].includes("PRIMARY KEY") ? col : []));
    const columnNames = data.map((json) => json[0]).filter((col) => col !== primaryKey[0]); 

    // Add GET Endpoint
    fs.appendFileSync(`api/autooperations/GET/${tableName}.js`, `
// WARNING: This File is Auto-Generated, and Will be Rebuilt on Every Deployment

const Get${tableName} = async (req, res) => {
  const dbClient = req.dbClient;
  try {
    const response = await dbClient.query("SELECT * FROM ${tableName}");
    if (response.rows.length == 0) {
      res.status(404).send();
    };
    res.status(200).json(response.rows).send();
  } catch {
    res.status(500).send();
  };
};

module.exports = Get${tableName};
    `)

    // Add POST Endpoint
    fs.appendFileSync(`api/autooperations/POST/${tableName}.js`, `
// WARNING: This File is Auto-Generated, and Will be Rebuilt on Every Deployment

const Post${tableName} = async (req, res) => {
  const dbClient = req.dbClient;
  const body = req.body;
  try {
    ${columnNames.map((name) => `const ${name} = body["${name}"];`).join("\n")}
    await dbClient.query(
      "INSERT INTO ${tableName} (${columnNames.join(",")}) VALUES (${columnNames.map((m, i) => `$${i+1}`)})",
      [${columnNames.join(",")}]);
    res.status(204).send();
  } catch {
    res.status(500).send();
  };
};
      
module.exports = Post${tableName};
          `)

    // Add PUT Endpoint
    fs.appendFileSync(`api/autooperations/PUT/${tableName}.js`, `
// WARNING: This File is Auto-Generated, and Will be Rebuilt on Every Deployment

const Put${tableName} = async (req, res) => {
  const dbClient = req.dbClient;
  const body = req.body;
  try {
    ${columnNames.map((name) => `const ${name} = body["${name}"];`).join("\n")}
    const ${primaryKey[0]} = body["${primaryKey[0]}"];
    await dbClient.query(
      "INSERT INTO ${tableName} (${columnNames.join(",")}) VALUES (${columnNames.map((m, i) => `$${i+1}`)}) WHERE ${primaryKey[0]}::${primaryKey[1][0].toLowerCase()} = $${columnNames.length+1}",
      [${columnNames.join(",")}, ${primaryKey[0]}]);
    res.status(204).send();
  } catch {
    res.status(500).send();
  };
};
      
module.exports = Put${tableName};
          `)
    
    // Add DELETE Endpoint
    fs.appendFileSync(`api/autooperations/DELETE/${tableName}.js`, `
// WARNING: This File is Auto-Generated, and Will be Rebuilt on Every Deployment

const Delete${tableName} = async (req, res) => {
  const dbClient = req.dbClient;
  const body = req.body;
  try {
    const ${primaryKey[0]} = body["${primaryKey[0]}"];
    await dbClient.query(
      "DELETE * FROM ${tableName} WHERE ${primaryKey[0]}::${primaryKey[1][0].toLowerCase()} = $1",
      [${primaryKey[0]}]);
    res.status(204).send();
  } catch {
    res.status(500).send();
  };
};
            
module.exports = Delete${tableName};
                `)

    // Add GET By ID Endpoint
    fs.appendFileSync(`api/autooperations/GET/${tableName}ById.js`, `
// WARNING: This File is Auto-Generated, and Will be Rebuilt on Every Deployment

const Get${tableName}ById = async (req, res) => {
  const dbClient = req.dbClient;
  const body = req.query;
  try {
    const ${primaryKey[0]} = body["${primaryKey[0]}"];
    await dbClient.query(
      "SELECT * FROM ${tableName} WHERE ${primaryKey[0]}::${primaryKey[1][0].toLowerCase()} = $1",
      [${primaryKey[0]}]);
    res.status(204).send();
  } catch {
    res.status(500).send();
  };
};
                  
module.exports = Get${tableName}ById;
  `)

  // Add Frontend Handler

  fs.appendFileSync(`frontend/src/APIHandler.js`, `
export const Get${tableName} = async () => {
  const response = await RequestFromAPI("/api/db/${tableName}", "GET", {})
  try {return await response.json()} catch {return []}
}

export const Get${tableName}ById = async (${primaryKey[0]}) => {
  const response = await RequestFromAPI("/api/db/${tableName}", "GET", {${primaryKey[0]}})
  try {return await response.json()} catch {return []}
}
 
export const Update${tableName} = async(${primaryKey[0]},${columnNames.join(",")}) => {
  const response = await RequestFromAPI("/api/db/${tableName}", "PUT", {${primaryKey[0]},${columnNames.join(",")}})
  try {return await response.json()} catch {return []}
}

export const Create${tableName} = async (${columnNames.join(",")}) => {
  const response = await RequestFromAPI("/api/db/${tableName}", "POST", {${columnNames.join(",")}})
  try {return await response.json()} catch {return []}
}

export const Delete${tableName} = async (${primaryKey[0]}) => {
  const response = await RequestFromAPI("/api/db/${tableName}", "DELETE", {${primaryKey[0]}})
  try {return await response.json()} catch {return []}
}

`);
  }
});



console.log("Finished Compiling Models");

