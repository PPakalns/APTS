'use strict'

const Lucid = use('Lucid')

class Testresult extends Lucid {

    submission() {
        return this.belongsTo('App/Model/Submission','id','submission_id')
    }

}

module.exports = Testresult
