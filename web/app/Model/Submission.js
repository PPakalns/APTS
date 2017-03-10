'use strict'

const Lucid = use('Lucid')

const status_map = {
    0: "waiting",
    1: "testing",
    2: "ok",
    3: "ce",
    4: "ie"
}

class Submission extends Lucid {

    // ########################################
    // VALIDATION RULES

    static get rules () {
        return {
            type: 'required|in:cpp,cpp11'
        }
    }

    // ########################################
    // COMPUTED PROPERTIES


    static get computed () {
        return ['statusname']
    }


    getStatus_name () {
        return status_map[this.status]
    }


    // ########################################
    // SCHEME RELATIONSHIPS


    user () {
        return this.belongsTo('App/Model/User', 'id', 'user_id')
    }

    assignment () {
        return this.belongsTo('App/Model/Assignment')
    }

    file () {
        return this.belongsTo('App/Model/File')
    }

    testset () {
        return this.belongsTo('App/Model/Testset')
    }

    judge () {
        return this.belongsTo('App/Model/User', 'id', 'judge_id')
    }
}

module.exports = Submission
