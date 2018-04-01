'use strict'

const Model = use('Model')

class Assignment extends Model {

  // Returned value is used to display sidebar with
  // assignments for the group
  static async getGroupVisibleAssignments(group) {
    return (await group
        .assignments()
        .with('problem')
        .where('visible', true)
        .fetch()
      ).toJSON()
  }

  submissions () {
    return this.hasMany('App/Models/Submission')
  }

  problem() {
    return this.belongsTo('App/Models/Problem', 'problem_id', 'id')
  }

  group() {
    return this.belongsTo('App/Models/Group', 'group_id', 'id')
  }
}

module.exports = Assignment
