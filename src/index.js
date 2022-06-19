const fs = require('node:fs/promises');
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const JSONdb = require('simple-json-db');
const Image = require('./image');

let watermark;

const rel = (relativePath) => path.join(__dirname, relativePath)
const throwOnFailed = (promise) => promise.then(err => { if (err) throw new Error(err) })

const db = new JSONdb(rel('../processed/data.json'));

const app = express();
app.use(fileUpload());

app.get('/', (req, res) => {
    res.sendFile(rel('../public/index.html'));
});

app.get('/data', async (req, res) => {
    const images = (db.get('data') || []).map(image => image.filename)
    const tags = db.get('tags') || []

    res.send({
        images,
        tags
    })
})

app.get('/image/:filename', (req, res) => {
    console.log(rel(`../processed/${req.params.filename}`))
    res.sendFile(rel(`../processed/${req.params.filename}`));
})

app.post('/upload', async (req, res) => {
    if (!req.files) {
        return res.status(400).send('No files were uploaded.');
    }

    try {
        const { title, description, tags } = req.body;
        const { data, name } = req.files.photo;

        const image = new Image(data)
        const nameNoExt = name.split('.')[0];

        const metadata = await image.metadata()
        const tinyBuffer = await image.toJpeg(28, 50)
        const smallBuffer = await image.toJpeg(450, 80)
        const largeBuffer = await image.toJpeg(1200, 95, watermark, true)

        const smallName = `${nameNoExt}_450px.jpeg`;
        const largeName = `${nameNoExt}_1200px.jpeg`;

        await throwOnFailed(fs.writeFile(rel(`../processed/${smallName}`), smallBuffer))
        await throwOnFailed(fs.writeFile(rel(`../processed/${largeName}`), largeBuffer))

        const tinyBase64 = 'data:image/jpg;base64,' + tinyBuffer.toString('base64')
        
        const tagsArr = tags ? tags.replace(/\s/g, '').split(',') : []

        const rows = db.get('data') || [];
        rows.push({
            id: rows.length + 1,
            title: title || nameNoExt,
            filename: name,
            description,
            tags: tagsArr,
            base64: tinyBase64,
            small: smallName,
            large: largeName,
            metadata,
        });
        db.set('data', rows);

        if (tagsArr.length > 0) {
            const tagRows = new Set(db.get('tags') || []);
            tagsArr.forEach(tag => tagRows.add(tag));
            db.set('tags', Array.from(tagRows))
        }

        db.sync();

        res.send({
            status: 'success',
            message: `Processed image ${nameNoExt}`,
            image: largeName,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error. ' + err.toString());
    }

});

app.listen(8080, async () => {
    watermark = await fs.readFile(rel('./signatures/sig_white.png'))
    console.log('App is running on port 8080')
})
