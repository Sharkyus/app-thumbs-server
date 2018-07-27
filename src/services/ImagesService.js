/**
 * Created by sharkyus on 2/1/2017.
 */

let { Image, sequelize } = require(`${process.cwd()}/src/models`),
    sharp = require('sharp'),
    _ = require('lodash');

class ImagesService{
    constructor(app){
        this.imagesBuffers = [];

        app.get('/api/images', async(req, res)=>{
            let { limit, offset, width: imageWidth, typeImg } = req.query;
            let images = await Image.findAll({ limit: Number(limit), offset: Number(offset), raw: true, fields: ['id', 'name'] });

            let promises = [];
            images.forEach((image)=>{
                image.url = `${req.protocol}://${req.get('host')}/${image.name}`;
                let processPromise = this.createPreview(this._getImageSrc(image.name), Number(imageWidth), image.rotate, typeImg === "progressive");
                processPromise.then((buffer)=>{
                    this.imagesBuffers[image.name] = buffer;
                });
                promises.push(processPromise);
            });

            await Promise.all(promises);
            res.send(images);
        });

        app.get('/:image([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}.jpg)', async(req, res)=>{
            let image = this.imagesBuffers[req.params.image];

            if (image) {
                res.send(image);
                return delete this.imagesBuffers[req.params.image];
            }

            let imgData = await Image.findByName(req.params.image);
            res.setHeader("Content-Type", "image/jpeg");
            res.send(await this.createPreview(this._getImageSrc(imgData.name), false, imgData.rotate));
        });

        app.put('/api/images', async(req, res)=>{
            let { items, globalRotate } = req.body;
            let imgIds = items.map(img=>img.id);
            let casesList = [];

            items.forEach((img)=>{
                if (!(_.isNumber(img.id) && _.isNumber(img.rotate))) return;
                casesList.push(`WHEN ${img.id} THEN (360+(\`rotate\`+${img.rotate}))%360`);
            });

            try {
                await sequelize.query(
                    `UPDATE \`image\` SET \`rotate\`= ( CASE id ${casesList.join(' ')} END ) WHERE id IN (?)`,
                    { replacements: [imgIds], type: sequelize.QueryTypes.UPDATE }
                );
                if (globalRotate) {
                    await sequelize.query(
                        'UPDATE `image` SET `rotate`=`rotate`+? WHERE id NOT IN (?)',
                        { replacements: [globalRotate, imgIds], type: sequelize.QueryTypes.UPDATE }
                    );
                }
            } catch (e) {
                res.send(false);
            }
            res.send(true);
        });
    }
    async createPreview(src, size, angle, progressive = true){
        let image = sharp(src);
        await image.rotate(angle);
        let imageBuffer = await image.toBuffer(),
            rotatedImage = sharp(imageBuffer),
            { width, height } = await rotatedImage.metadata();

        if (size && size > 0) {
            await rotatedImage.resize(width > height ? Number(size.toFixed()) : null, width <= height ? Number(size.toFixed()) : null);
        }
        return rotatedImage.jpeg({ progressive }).toBuffer();
    }
    _getImageSrc(name){
        return `${process.cwd()}/public/original/${name}`;
    }
}

module.exports = ImagesService;
