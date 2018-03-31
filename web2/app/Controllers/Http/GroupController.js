'use strict'

const Group = use('App/Models/Group')
const Assignment = use('App/Models/Assignment')
const User = use('App/Models/User')

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

    return ctx.view.render('groups.show',
      { group: group.toJSON(),
        groupVisibleAssignments: await Assignment.getGroupVisibleAssignments(group),
      })
  }

  async create ({ view }) {
    return view.render('groups.create')
  }

  async store ({ request, response }) {
    const data = request.only(['name', 'description', 'public'])
    data.public = !!data.public;

    const group = await Group.create(data)
    return response.route('GroupController.show', {id: group.id})
  }

  async edit ({ params, view }) {
    const group = await Group.findOrFail(params.id)
    return view.render('groups.edit',
      { group: group.toJSON(),
        groupVisibleAssignments: await Assignment.getGroupVisibleAssignments(group),
      })
  }

  async update ({ request, response, params }) {
    const data = request.only(['name', 'description', 'public'])
    data.public = !!data.public;

    const group = await Group.findOrFail(params.id)
    group.merge(data)
    await group.save()

    return response.route('GroupController.show', {id: group.id})
  }

  async participants ({ params, view }) {
    const group = await Group.findOrFail(params.id)
    await group.load('users')

    let participantIdList = []
    let participants = group.toJSON().users
    for (let user of participants) {
      participantIdList.push(user.id)
    }

    let candidates = await User.query()
                               .whereNotIn('id', participantIdList)
                               .fetch()

    return view.render('groups.participants',
      { candidates: candidates.toJSON(),
        group: group.toJSON(),
        groupVisibleAssignments: await Assignment.getGroupVisibleAssignments(group),
      })
  }

  async addParticipant ({ params, response, session, antl }) {
    let group = await Group.findOrFail(params.id)
    let user = await User.findOrFail(params.user_id)

    if ((await Group.isParticipant(user, group)) == true) {
      session.flash({ error: antl.formatMessage('main.already_a_participant', user.toJSON()) })
      return response.redirect('back')
    }

    await user.groups().attach([group.id])

    session.flash({ success: antl.formatMessage('main.participant_added', user.toJSON()) })
    return response.redirect('back')
  }

  async removeParticipant ({ params, session, response, antl }) {
    let group = await Group.findOrFail(params.id)
    let user = await User.findOrFail(params.user_id)

    if ((await Group.isParticipant(user, group)) == false) {
      session
        .flash({ error: antl.formatMessage('main.already_a_non_participant', user.toJSON()) })
      return response.redirect('back')
    }

    await user.groups().detach([group.id])

    session.flash({ success: antl.formatMessage('main.participant_removed', user.toJSON()) })
    return response.redirect('back')
  }
}

module.exports = GroupController
