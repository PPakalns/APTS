'use strict'

const Model = use('Model')

class Group extends Model {
  users () {
    return this.belongsToMany(
      'App/Models/User',
      'group_id',
      'user_id',
      'id',
      'id'
    ).pivotTable('user_group')
  }

  assignments() {
    return this.hasMany('App/Models/Assignment', 'id', 'group_id')
  }

  /**
   * Check that user can view this group
   * User can view public groups, groups that he participates in
   * Only adminstrator can view all groups
   */
  static async hasViewPermission({ auth, request }, group) {
    if (request.roles.admin)
      return true;
    if (group.public)
      return true;
    if (request.roles.auth == false)
      return false;
    // User is signed in and this is not a public group
    // Therefore user must be participant to view this group
    let user = await auth.getUser()
    let grCnt = await user.groups().where('groups.id', group.id).getCount()
    return (grCnt > 0)
  }

  static async checkViewPermission(ctx, group) {
    if (await Group.hasViewPermission(ctx, group))
      return true;
    ctx.session
      .flash({ error: ctx.antl.formatMessage('main.no_permissions') })
    ctx.response.redirect('back')
    return false;
  }
}

module.exports = Group
