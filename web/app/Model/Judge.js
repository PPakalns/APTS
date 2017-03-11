'use strict'

const Lucid = use('Lucid')

class Judge extends Lucid {

    submission () {
        return this.belongsTo('App/Model/Submission', 'id', 'submission_id')
    }

    submissions () {
        this.hasMany('App/Model/Submission')
    }
}

module.exports = Judge
