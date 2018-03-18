'use strict'

const Group = use('App/Models/Group')

class GroupController {

  async index ({ request, view, auth }) {

    // List of groups where user is participating
    let groups = []
    if (request.roles.auth) {
      let user = await auth.getUser()
      groups = (await user.groups().fetch()).toJSON()
    }

    // List of all public groups
    let publicGroups = await Group.query().where('public', true).fetch()

    // List of all groups for admin
    let allGroups = []
    if (request.roles.admin) {
      allGroups = (await Group.all()).toJSON()
    }

    return view.render('groups.index',
                       { groups: groups,
                         publicGroups: publicGroups.toJSON(),
                         allGroups: allGroups })
  }

  async show (ctx) {
    const group = await Group.findOrFail(ctx.params.id)

    // Check view permissions
    if ((await Group.checkViewPermission(ctx, group)) == false) {
      return;
    }

    // TODO: get visible assignment list

    return ctx.view.render('groups.show', { group: group.toJSON() })
  }

  async create () {
  }

  async store () {
  }

  async edit () {
  }

  async update () {
  }
}

module.exports = GroupController
