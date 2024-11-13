const express = require('express');
const abilities = require('./data/abilities.json');
const dex = require('./data/dex.json');
const extinctionLevels = require('./data/extinctionLevels.json');
const info = require('./data/info.json');
let types = require('./data/types.json');
const errorMessages = require('./errorMessages.json');

const app = express();
const port = 3000;

app.get('/api/status', (req, res) => {
    return res.status(200).json({
        "name": info.name,
        "status": "OK",
        "version": info.version
    });
});

app.get('/api/types', (req, res) => {

    if (req.query.id) {
        const type = types.find(type => type.id == req.query.id);
        if (type)
            return res.status(200).json(type);
        else
            return res.status(404).json({ error: errorMessages.typeNotFound });
    }

    if (req.query.weaknesses) {
        const weaknesses = req.query.weaknesses.split(',').map(Number);

        const filteredTypes = types.filter(type =>
            weaknesses.every(weakness => type.weaknesses.includes(weakness))
        );

        if (filteredTypes.length === 0)
            return res.status(404).json({ error: errorMessages.weaknessesNotFound });
        else
            return res.status(200).json(filteredTypes.sort((a, b) => a.id - b.id));
    }

    return res.status(200).json(types.sort((a, b) => a.id - b.id));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = app;