const fs = require('node:fs/promises');
const express = require('express');
const fileUpload = require('express-fileupload');
const Image = require('./image');
const DatabaseConnection = require('./database')
const { relativePath, throwOnFailed } = require('./utils');

const PORT = process.env.PORT || 8080;

const DB_CONN = new DatabaseConnection(relativePath('../processed/data.json'));

let watermark;

const app = express();
app.use(fileUpload());

app.get('/', (req, res) => {
    res.sendFile(relativePath('../public/index.html'));
});

app.use(express.static('public'))

app.get('/data', async (req, res) => {
    const { images, tags } = DB_CONN.getData();

    res.send({
        images: images.map(image => image.originalFilename),
        tags,
    });
});

app.get('/image/:filename', (req, res) => {
    res.sendFile(relativePath(`../processed/${req.params.filename}`));
});

// Temporary to be consumed by website
app.use(express.static('processed'));

app.post('/upload', async (req, res) => {
    if (!req.files) {
        return res.status(400).send('No files were uploaded.');
    }

    try {
        const { title, description, tags } = req.body;
        const { data, name: filename } = req.files.photo;

        const image = new Image(data);

        watermark = watermark ?? await fs.readFile(relativePath('./signatures/sig_white.png'));

        const metadata = await image.metadata();
        const tinyBuffer = await image.toJpeg(28, 50);
        const smallBuffer = await image.toJpeg(450, 80);
        const largeBuffer = await image.toJpeg(1200, 95, true, watermark);

        // const nameNoExt = name.split('.')[0];
        const newFilename = title.replace(' ', '_').replace(/[^\w\s_]/gi, '');
        const small = `${newFilename}_450px.jpeg`;
        const large = `${newFilename}_1200px.jpeg`;

        await Promise.all([
            throwOnFailed(fs.writeFile(relativePath(`../processed/${small}`), smallBuffer)),
            throwOnFailed(fs.writeFile(relativePath(`../processed/${large}`), largeBuffer))
        ]);

        const base64 = 'data:image/jpg;base64,' + tinyBuffer.toString('base64');
        
        const tagsArr = tags ? tags.replace(/\s/g, '').split(',') : [];

        DB_CONN.insertImage({
            title,
            description,
            base64,
            small,
            large,
            metadata,
            originalFilename: filename,
        });

        DB_CONN.insertTags(tagsArr);

        res.send({
            status: 'success',
            message: `Processed image ${title}`,
            image: large,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error. ' + err.toString());
    }
});

app.listen(PORT, async () => {
    console.log(`App is running on port ${PORT}`);
});
