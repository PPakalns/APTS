'use strict'

const Lucid = use('Lucid')

class Testset extends Lucid {

    static copy(from, to) {
        const arr = ["problem_id", "updated", "timelimit", "memory", "test_count",
                     "zip_id", "checker_id"]

        for (let key of arr)
        {
            to[ key ] = from[ key ]
        }
    }

    tests () {
        return this.hasMany('App/Model/Test')
    }

    problem () {
        return this.belongsTo('App/Model/Problem')
    }

    submissions () {
        return this.hasMany('App/Model/Submission')
    }

    zip () {
        return this.belongsTo('App/Model/File', 'id', 'zip_id')
    }

    checker () {
        return this.belongsTo('App/Model/File', 'id', 'checker_id')
    }
}

module.exports = Testset
