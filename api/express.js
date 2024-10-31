const express = require('express');
const LoadOperations = require('./functions/LoadOperations');

const app = express();
const port = 5000;

app.use(express.json());

LoadOperations(app).then(() => {
  // Start the server
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
})
