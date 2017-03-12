'use strict'

const Lucid = use('Lucid')

class Testresult extends Lucid {

    submission() {
        return this.belongsTo('App/Model/Submission','id','submission_id')
    }

    test() {
        return this.belongsTo('App/Model/Test', 'id', 'test_id')
    }
}

module.exports = Testresult
