let fs = require('fs'),
    request = require('request'),
    uuid = require('uuid'),
    { Image, sequelize } = require('./src/models'),
    path = require('path');

    initDbSql = fs.readFileSync(`${process.cwd()}/migrations/init.sql`).toString(),
    config = require(`${process.cwd()}/config/dev.json`),
    targetImagesCount = config.initialImagesCount,
    downloadedCountPerIteration = 30;


/////////// CHECK CONNECTION AND START ///////////

sequelize
    .authenticate()
    .then(async() => {
        console.log('Connection has been established successfully.');

        await applyMigrations();

        console.log('Migrations applied');
        console.log('Start fill database');

        await startDownload();

        console.log('Init completed');

        process.exit();
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

/////////////////////////////////////////////////////

const getRandomInt = (min, max)=>{
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const download = (uri, path)=>{
    return new Promise((resolve)=>{
        request.head(uri, ()=>{
            request(uri).pipe(fs.createWriteStream(path)).on('close', resolve);
        });
    });
};

const createFolder = (name) => {
    let directories = name.split('/'),
        curDir = process.cwd();

    directories.forEach((dir)=>{
        curDir = path.join(curDir, dir);
        if (!fs.existsSync(curDir)){
            fs.mkdirSync(curDir);
        }
    });
    return curDir;
};


const startDownload = () => {
    return new Promise(async(res)=>{
        let imagesPath = createFolder('public/original');

        let i = 0;
        while(i < targetImagesCount) {
            let promises = [];

            for(let j = 0; j < downloadedCountPerIteration; j++) {

                let width = [1280,1100,900][getRandomInt(0,2)],
                    height = [900,740,600][getRandomInt(0,2)],
                    name = `${uuid()}.jpg`,
                    filePath = `${imagesPath}/${name}`;

                Image.create({ name, rotate: 0 });

                let dlPromise = download(`https://picsum.photos/${width}/${height}/?random`, filePath);
                promises.push(dlPromise);
                i++;

                if (i === targetImagesCount) break;
            }

            await Promise.all(promises);
            console.log(`Downloaded images count ${i}`);
            if (i === targetImagesCount) {
                res();
            }
        }
    });
};

const applyMigrations = () => {
    return sequelize.query(initDbSql);
};
