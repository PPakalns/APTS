'use strict'

const Lucid = use('Lucid')

class Judge extends Lucid {


    submission () {
        this.belongsTo('App/Model/Submission')
    }

}

module.exports = Judge
