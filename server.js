const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const errorhandler = require('errorhandler');

const PORT = process.env.PORT || 4000;

const app = express();

const apiRouter = require('./api/api');

app.use(bodyParser.json());

app.use(cors());

app.use('/api', apiRouter);

app.use(errorhandler());

app.listen(PORT, () => {
  console.log(`listening on port: ${PORT}`);
});

module.exports = app;
