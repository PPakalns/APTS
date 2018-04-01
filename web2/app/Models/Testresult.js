'use strict'

const Model = use('Model')

class Testresult extends Model {
    submission() {
        return this.belongsTo('App/Models/Submission', 'submission_id', 'id')
    }

    test() {
        return this.belongsTo('App/Models/Test', 'test_id', 'id')
    }
}

module.exports = Testresult
