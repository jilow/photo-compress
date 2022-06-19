const fs = require('node:fs/promises');
const path = require('path');
const Image = require('./image');

const rel = (relativePath) => path.join(__dirname, relativePath)

const main = async function() {
    try {
        const sigBuffer = await fs.readFile(rel('./signatures/sig_white.png'))
        const inputBuffer = await fs.readFile(rel('../photos/DSC03912.JPG'))

        const image = new Image(inputBuffer)

        const metadata = await image.metadata()

        const smallBuffer = await image.toJpeg(450, 80)
        const largeBuffer = await image.toJpeg(1200, 95, sigBuffer, true)

        let errors = []
        errors.push(await fs.writeFile(rel('../output/DSC03912_450px.jpeg'), smallBuffer))
        errors.push(await fs.writeFile(rel('../output/DSC03912_1200px.jpeg'), largeBuffer))
        // if (errors.length > 0) throw errors;
        
        console.log('Done!', JSON.stringify(metadata))

    } catch(err) {
        console.log(err)
    }
};

main();
