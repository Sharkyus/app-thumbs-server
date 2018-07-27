module.exports = function(sequelize, DataTypes) {
    let Sequelize = require('sequelize');
    let Image = sequelize.define('Image', {
        name: {
            type: Sequelize.STRING
        },
        rotate: {
            type: Sequelize.INTEGER
        },

    }, {
        tableName: 'image',
        timestamps: false
    });

    Image.findByName=(name)=>{
        return Image.findOne({ where: { name } });
    };

    return Image;
};
