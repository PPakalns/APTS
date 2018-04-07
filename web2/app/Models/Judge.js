'use strict'

const Model = use('Model')

class Judge extends Model {

    submission () {
        return this.belongsTo('App/Models/Submission', 'submission_id', 'id')
    }

    submissions () {
        this.hasMany('App/Models/Submission')
    }
}

module.exports = Judge
