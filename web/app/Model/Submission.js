'use strict'

const Lucid = use('Lucid')

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


    getStatusname () {
        const status_map = {
            0: "WAIT",
            1: "TESTING",
            2: "OK",
            3: "CE",
            4: "IE"
        }
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
