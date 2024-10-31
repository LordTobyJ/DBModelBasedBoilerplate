const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

const ConnectToDB = async () => {
  return await pool.connect();
};

const ConnectToDBMiddleware = async (req, res, next) => {
  try {
    console.log(`DB Connection:    Establish:    ${req.originalUrl}`);

    let client = await pool.connect();

    req.dbClient = client;

    res.on('finish', () => {
      console.log(`DB Connection:    Flush:    ${req.originalUrl}`)
      client.release();
    });

    next();
  } catch {
    res.status(500).send();
  }
};

module.exports = { ConnectToDB, ConnectToDBMiddleware };

