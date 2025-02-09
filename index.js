const express = require('express');
const path = require('path');
const abilities = require('./data/abilities.json');
const dex = require('./data/dex.json');
const extinctionLevels = require('./data/extinctionLevels.json');
const info = require('./data/info.json');
let types = require('./data/types.json');
const messages = require('./data/messages.json');
const redis = require("redis");
const dotenv = require('dotenv');
dotenv.config();

const redisClient = redis.createClient({
    url: process.env.REDIS_CONNECTION_URL || process.env.KV_URL,
});

redisClient.connect().catch(console.error);

const cache = async (req, res, next) => {
    const key = req.originalUrl;
    const cachedData = await redisClient.get(key);

    if (cachedData) {
        console.log("Cache hit");
        return res.json(JSON.parse(cachedData));
    }

    console.log("Cache miss");
    next();
};

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index', {
        title: 'BagdexAPI',
        endpoints: [
            { path: '/api/status', description: 'Veja o status atual da API' },
            { path: '/api/types', description: 'Veja os tipos dos Bagmon' },
            { path: '/api/dex', description: 'Listar Bagmons' },
            { path: 'api/extinction-levels', description: 'Listar níveis de extinção' }
        ]
    });
});

app.get('/api/status', (req, res) => {
    return res.status(200).json({
        "name": info.name,
        "status": "OK",
        "version": info.version
    });
});

app.get('/api/types', cache, async (req, res) => {

    if (req.query.id) {
        const type = types.find(type => type.id == req.query.id);
        if (type)
            return res.status(200).json(type);
        else
            return res.status(404).json(messages.typeNotFound);
    }

    if (req.query.weaknesses) {
        const weaknesses = req.query.weaknesses.split(',').map(Number);

        const filteredTypes = types.filter(type =>
            weaknesses.every(weakness => type.weaknesses.includes(weakness))
        );

        if (filteredTypes.length === 0)
            return res.status(404).json(messages.weaknessesNotFound);
        else
            return res.status(200).json(filteredTypes.sort((a, b) => a.id - b.id));
    }

    await redisClient.setEx(req.originalUrl, 3600, JSON.stringify(types.sort((a, b) => a.id - b.id)));

    return res.status(200).json(types.sort((a, b) => a.id - b.id));
});

app.get('/api/dex', cache, async (req, res) => {

    if (req.query.id) {
        const bagmon = dex.find(bagmon => bagmon.id == req.query.id);
        if (bagmon)
            return res.status(200).json(bagmon);
        else
            return res.status(404).json(messages.bagmonNotFound);
    }

    if (req.query.starter) {
        if (req.query.starter !== 'true' && req.query.starter !== 'false')
            return res.status(404).json(messages.starterValueInvalid);

        const bagmonList = dex.filter(bagmon => bagmon.starter === (req.query.starter === 'true'));

        if (bagmonList)
            return res.status(200).json(bagmonList);
        else
            return res.status(404).json(messages.starterValueInvalid);
    }

    if (req.query.types) {
        const types = req.query.types.split(',').map(Number);

        const filteredDex = dex.filter(bagmon =>
            types.every(type => bagmon.types.includes(type))
        );

        if (filteredDex.length === 0)
            return res.status(404).json(messages.bagmonNotFound);
        else
            return res.status(200).json(filteredDex.sort((a, b) => a.id - b.id));
    }

    await redisClient.setEx(req.originalUrl, 3600, JSON.stringify(dex.sort((a, b) => a.id - b.id)));
    
    return res.status(200).json(dex.sort((a, b) => a.id - b.id));
});

app.get('/api/extinction-levels', cache, async (req, res) => {

    if (req.query.level) {
        extinction = extinctionLevels.find(extinction => extinction.level == req.query.level);

        if (extinction)
            return res.status(200).json(extinction);
        else
            return res.status(404).json(messages.extinctionLevelInvalid);
    }

    await redisClient.setEx(req.originalUrl, 3600, JSON.stringify(extinctionLevels));

    return res.status(200).json(extinctionLevels);
});

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}/`);
});

module.exports = app;