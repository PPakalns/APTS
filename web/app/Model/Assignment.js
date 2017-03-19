'use strict'

const Lucid = use('Lucid')

class Assignment extends Lucid {

    static get options_rules () {
        return {
            score_vis: 'required|integer',
        }
    }

    static scopeVisible (builder) {
        builder.where('visible', 1)
    }

    submissions () {
        return this.hasMany('App/Model/Submission')
    }

    problem() {
        return this.belongsTo('App/Model/Problem', 'id', 'problem_id')
    }

    group() {
        return this.belongsTo('App/Model/Group', 'id', 'group_id')
    }
}

module.exports = Assignment
