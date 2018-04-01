'use strict'

const Model = use('Model')

const STATUS_MAP = {
    0: "WAIT",
    1: "TESTING",
    2: "OK",
    3: "CE",
    16: "IE_1",
    17: "IE_2"
}

class Submission extends Model {

    static get computed () {
        return ['statusname', 'statuscolor']
    }

    static getStatus(status)
    {
        if (STATUS_MAP.hasOwnProperty(status))
            return STATUS_MAP[status]
        else
            return 'UNKNOWN'
    }

    getStatuscolor() {
        return "cc c_"+this.getStatusname()
    }

    getStatusname () {
        return Submission.getStatus(this.status)
    }

    user () {
        return this.belongsTo('App/Models/User', 'user_id', 'id')
    }

    assignment () {
        return this.belongsTo('App/Models/Assignment')
    }

    judge () {
        return this.hasOne('App/Models/Judge', 'judge_id', 'id')
    }

    judgeinv () {
        return this.belongsTo('App/Models/Judge', 'submission_id', 'id')
    }

    file () {
        return this.belongsTo('App/Models/File')
    }

    testset () {
        return this.belongsTo('App/Models/Testset', 'testset_id', 'id')
    }

    testresults () {
        return this.hasMany('App/Models/Testresult', 'submission_id', 'id')
    }
}

module.exports = Submission
