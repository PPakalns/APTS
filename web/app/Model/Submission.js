'use strict'

const Lucid = use('Lucid')

const STATUS_MAP = {
    0: "WAIT",
    1: "TESTING",
    2: "OK",
    3: "CE",
    16: "IE_1",
    17: "IE_2"
}

class Submission extends Lucid {

    // #######################################
    // Judge requests

    static *getJudgableSubmission()
    {
        let submission = yield this.query().where('status', 0).first();
        return submission
    }

    static getStatus(status)
    {
        if (STATUS_MAP.hasOwnProperty(status))
            return STATUS_MAP[status]
        else
            return 'UNKNOWN'
    }


    // ########################################
    // VALIDATION RULES

    static get rules () {
        return {
            type: 'required|in:cpp,cpp11,c,c11,fpc'
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
        return Submission.getStatus(this.status)
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
        return this.belongsTo('App/Model/Testset', 'id', 'testset_id')
    }

    testresults () {
        return this.hasMany('App/Model/Testresult', 'id', 'submission_id')
    }
}

module.exports = Submission
