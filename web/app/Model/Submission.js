'use strict'

const Lucid = use('Lucid')

class Submission extends Lucid {

    // #######################################
    // Judge requests

    static *getJudgableSubmission()
    {
        let submission = yield this.query().where('status', 0).first();
        return submission
    }


    // ########################################
    // VALIDATION RULES

    static get rules () {
        return {
            type: 'required|in:cpp,cpp11,c,c11'
        }
    }

    // ########################################
    // COMPUTED PROPERTIES


    static get computed () {
        return ['statusname', 'statuscolor']
    }

    getStatuscolor() {
        return "cc c_"+this.getStatusname()
    }

    getStatusname () {
        const status_map = {
            0: "WAIT",
            1: "TESTING",
            2: "OK",
            3: "CE",
            16: "IE_1",
            17: "IE_2"
        }
        if (status_map.hasOwnProperty(this.status))
            return status_map[this.status]
        else
            return 'UNKNOWN'
    }


    // ########################################
    // SCHEME RELATIONSHIPS


    user () {
        return this.belongsTo('App/Model/User', 'id', 'user_id')
    }

    assignment () {
        return this.belongsTo('App/Model/Assignment')
    }

    judge () {
        return this.hasOne('App/Model/Judge', 'id', 'judge_id')
    }

    judgeinv () {
        return this.belongsTo('App/Model/Judge', 'id', 'submission_id')
    }

    file () {
        return this.belongsTo('App/Model/File')
    }

    testset () {
        return this.belongsTo('App/Model/Testset')
    }

    testresults () {
        return this.hasMany('App/Model/Testresult', 'id', 'submission_id')
    }
}

module.exports = Submission
