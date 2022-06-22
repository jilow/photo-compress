const sharp = require('sharp');
const exifReader = require('exif-reader');
const piexif = require('piexifjs');

const addAuthorData = async (buffer) => {
    const data = buffer.toString('binary');
    const exifBytes = piexif.dump({
        "0th": {
            [piexif.ImageIFD.Artist]: 'Jiaan Louw',
            [piexif.ImageIFD.Copyright]: 'Jiaan Louw, All Rights Reserved',
        },
    })
    const newData = piexif.insert(exifBytes, data);

    return Buffer.from(newData, 'binary');
}

class Image {
    constructor(inputBuffer) {
        this.image = sharp(inputBuffer);
    }

    async toJpeg(size, quality = 80, addExif = false, signature = null) {
        const composites = signature ? [{ input: signature, gravity: 'southeast', blend: 'soft-light' }] : []

        const buffer = await this.image
                            .resize(size)
                            .composite(composites)
                            .jpeg({ mozjpeg: true, quality })
                            .toBuffer();

        return addExif ? addAuthorData(buffer) : buffer;
    }

    async metadata() {
        const { width, height, exif } = await this.image.metadata();
        const tags = exifReader(exif);

        return {
            make: tags.image?.Make,
            model: tags.image?.Model,
            speed: tags.exif?.ExposureTime,
            fStop: tags.exif?.FNumber,
            iso: tags.exif?.ISO,
            focalLength: tags.exif?.FocalLength,
            focalLengthIn35: tags.exif?.FocalLengthIn35mmFormat,
            lensModal: tags.exif?.LensModel,
            lensSpecs: tags.exif?.LensSpecification,
            dateTime: tags.exif?.DateTimeOriginal,
            aspectRatio: width / height,
        }
    }
}

module.exports = Image;
