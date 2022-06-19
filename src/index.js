const fs = require('node:fs/promises');
const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const JSONdb = require('simple-json-db');
const Image = require('./image');

let watermark;

const rel = (relativePath) => path.join(__dirname, relativePath)
const throwOnFailed = (promise) => promise.then(err => { if (err) throw err })

const db = new JSONdb(rel('../processed/data.json'));

const app = express();
app.use(fileUpload());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.post("/upload", async (req, res) => {
    // TODO: process the file upload
    if (!req.files) {
        return res.status(400).send("No files were uploaded.");
    }

    const { data, name } = req.files.photo;

    try {

        const image = new Image(data)
        const nameNoExt = name.split('.')[0];

        const metadata = await image.metadata()
        const smallBuffer = await image.toJpeg(450, 80)
        const largeBuffer = await image.toJpeg(1200, 95, watermark, true)

        const smallPath = `../processed/${nameNoExt}_450px.jpeg`;
        const largePath = `../processed/${nameNoExt}_1200px.jpeg`;

        await throwOnFailed(fs.writeFile(rel(`../processed/${nameNoExt}_450px.jpeg`), smallBuffer))
        await throwOnFailed(fs.writeFile(rel(`../processed/${nameNoExt}_1200px.jpeg`), largeBuffer))

        const rows = db.get('data') || [];
        rows.push({
            id: rows.length + 1,
            small: smallPath,
            large: largePath,
            metadata,
        });
        db.set('data', rows);
        db.sync();

        res.send({
            status: 'success',
            message: `Processed image ${nameNoExt}`,
            data: metadata
        });
    } catch (err) {
        res.status(500).send(err);
    }

});

app.listen(8080, async () => {
    watermark = await fs.readFile(rel('./signatures/sig_white.png'))
    console.log('App is running on port 8080')
})
