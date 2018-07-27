let Sequelize = require('sequelize');
let config = require(`${process.cwd()}/config/dev.json`);

let sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    logging: false,
    dialect: 'mysql'
});

let db = {
    Sequelize: Sequelize,
    sequelize: sequelize
};

db.Image = sequelize.import('./Image');

for (let i in db){
    let model = db[i];
    if (model.initRelations) {
        model.initRelations();
    }
}

module.exports = db;