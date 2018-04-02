'use strict'

const Model = use('Model')
const Group = use('App/Models/Group')

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

  // Validate that user can see this assignment
  static async checkViewPermission(ctx, assignment) {
    let { request, session, response, antl } = ctx
    let group = assignment.group().fetch()
    // Check if user has access to the group
    if ((await Group.checkViewPermission(ctx, group)) == false) {
      return false
    }
    // Check if assignment is visible to user
    if (!assignment.visible && !request.roles.admin) {
      session
        .flash({ error: antl.formatMessage('main.no_permissions') })
      response.redirect('back')
      return false
    }
    return true
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
