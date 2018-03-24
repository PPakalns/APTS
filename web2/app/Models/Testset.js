'use strict'

const Model = use('Model')

class Testset extends Model {

    tests () {
        return this.hasMany('App/Models/Test')
    }

    problem () {
        return this.belongsTo('App/Models/Problem')
    }

    submissions () {
        return this.hasMany('App/Models/Submission')
    }

    zip () {
        return this.belongsTo('App/Models/File', 'zip_id', 'id')
    }

    checker () {
        return this.belongsTo('App/Models/File', 'checker_id', 'id')
    }
}

module.exports = Testset
