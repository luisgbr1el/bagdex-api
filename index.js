const express = require('express');
const path = require('path');
const info = require('./data/info.json');
const types = require('./data/types.json');
const dex = require('./data/dex.json');
const extinctionLevels = require('./data/extinctionLevels.json');
const evolutionTypes = require('./data/evolutionTypes.json');
const abilities = require('./data/abilities.json');
const messages = require('./data/messages.json');
const redis = require("redis");
const dotenv = require('dotenv');
dotenv.config();

const expirationTimeRedis = 3600;

const redisClient = redis.createClient({
    url: process.env.REDIS_CONNECTION_URL || process.env.KV_URL,
});

redisClient.connect().catch(console.error);

const cache = async (req, res, next) => {
    const key = req.originalUrl;
    const cachedData = await redisClient.get(key);

    if (cachedData)
        return res.json(JSON.parse(cachedData));

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
            { path: '/api/extinction-levels', description: 'Listar níveis de extinção' },
            { path: '/api/evolution-types', description: 'Listar tipos de evolução' }
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

    await redisClient.setEx(req.originalUrl, expirationTimeRedis, JSON.stringify(types.sort((a, b) => a.id - b.id)));

    return res.status(200).json(types.sort((a, b) => a.id - b.id));
});

app.get('/api/dex', cache, async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    if (isNaN(page) || page < 1) {
        return res.status(400).json(messages.pageParameterInvalid);
    }

    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 20;
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
        return res.status(400).json(messages.pageSizeParameterInvalid);
    }

    if (req.query.id) {
        const bagmon = dex.find(bagmon => bagmon.id == req.query.id);
        return bagmon 
            ? res.status(200).json({ count: 1, list: [bagmon] }) 
            : res.status(404).json(messages.bagmonNotFound);
    }

    let filteredDex = dex;

    if (req.query.starter) {
        if (req.query.starter !== 'true' && req.query.starter !== 'false') {
            return res.status(400).json(messages.starterValueInvalid);
        }
        filteredDex = filteredDex.filter(bagmon => bagmon.starter === (req.query.starter === 'true'));
    }

    if (req.query.types) {
        const types = req.query.types.split(',').map(Number);
        filteredDex = filteredDex.filter(bagmon => types.every(type => bagmon.types.includes(type)));
    }

    if (filteredDex.length === 0) {
        return res.status(404).json(messages.bagmonNotFound);
    }

    const totalItems = filteredDex.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;
    const paginatedDex = filteredDex.slice(startIndex, endIndex);

    if (paginatedDex.length === 0) {
        return res.status(400).json(messages.pageNotFound);
    }

    const response = { page, totalPages, count: paginatedDex.length, list: paginatedDex };
    await redisClient.setEx(req.originalUrl, expirationTimeRedis, JSON.stringify(response));
    return res.status(200).json(response);
});

app.get('/api/extinction-levels', cache, async (req, res) => {

    if (req.query.level) {
        extinction = extinctionLevels.find(extinction => extinction.level == req.query.level);

        if (extinction)
            return res.status(200).json(extinction);
        else
            return res.status(404).json(messages.extinctionLevelNotFound);
    }

    await redisClient.setEx(req.originalUrl, expirationTimeRedis, JSON.stringify(extinctionLevels));

    return res.status(200).json(extinctionLevels);
});

app.get('/api/evolution-types', cache, async (req, res) => {

    if (req.query.type) {
        evolution = evolutionTypes.find(evolution => evolution.type == req.query.type);

        if (evolution)
            return res.status(200).json(evolution);
        else
            return res.status(404).json(messages.evolutionTypeNotFound);
    }

    await redisClient.setEx(req.originalUrl, expirationTimeRedis, JSON.stringify(evolutionTypes));

    return res.status(200).json(evolutionTypes);
});

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}/`);
});

module.exports = app;