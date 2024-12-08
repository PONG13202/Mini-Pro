const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");

const userController = require('./controllers/UserController');
const contentController = require('./controllers/ContentController');

app.use(bodyParser.json({ limit: '5000mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5000mb' }));
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use('/user', userController);
app.use('/content', contentController);
app.use(bodyParser.json({limit: '5000mb'}))
app.get('/google-maps-key', (req, res) => {
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

app.listen(3001);