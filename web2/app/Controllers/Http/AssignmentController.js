'use strict'

const Antl = use('Antl')
const Assignment = use('App/Models/Assignment')
const Group = use('App/Models/Group')
const Problem = use('App/Models/Problem')

const score_vis_type_messages = {
  0:  Antl.formatMessage("main.assignment_vis_0"),  // public detailed
  4:  Antl.formatMessage("main.assignment_vis_4"),  // +full score
  8:  Antl.formatMessage("main.assignment_vis_8"),  // +all tests
  12: Antl.formatMessage("main.assignment_vis_12"), // +all tests detailed
}

class AssignmentController {

  async show(ctx) {
    let { params, session, response, request, antl, view } = ctx
    let assignment = await Assignment.findOrFail(params.id)
    let group = await Group.findOrFail(assignment.group_id)
    let problem = await Problem.findOrFail(assignment.problem_id)

    // Check if user has access to the group
    if ((await Group.checkViewPermission(ctx, group)) == false) {
      return
    }
    // Check if assignment is visible to user
    if (!assignment.visible && !request.roles.admin) {
      session
        .flash({ error: antl.formatMessage('main.no_permissions') })
      return response.redirect('back')
    }

    return view.render('problems.show',
      { problem: problem.toJSON(),
        assignment: assignment.toJSON(),
        group: group.toJSON(),
        groupVisibleAssignments: await Assignment.getGroupVisibleAssignments(group),
      })
  }

  async edit({ params, view }) {
    let group = await Group.findOrFail(params.group_id)
    let assignments = await group.assignments().with('problem').fetch()

    let problems = await Problem.query().whereNotExists(function() {
      this.from('assignments')
        .where('assignments.group_id', group.id)
        .whereRaw('assignments.problem_id = problems.id')
    }).fetch()

    return view.render('assignments.edit',
      { group: group.toJSON(),
        assignments: assignments.toJSON(),
        score_vis_type_messages,
        problems: problems.toJSON(),
        groupVisibleAssignments: await Assignment.getGroupVisibleAssignments(group),
      })
  }

  async store({ request, params, session, response, antl }) {
    let group = await Group.findOrFail(params.group_id)
    let problem = await Problem.findOrFail(params.problem_id)

    let exists = (await group.assignments().where('assignments.problem_id', problem.id).fetch()).size()
    if (exists) {
      session
        .flash({ error: antl.formatMessage('main.alert_exists') })
      return response.redirect('back')
    }

    let assignment = new Assignment()
    assignment.problem_id = problem.id
    assignment.score_visibility = 0
    assignment.group_id = group.id
    assignment.visible = true
    await assignment.save()

    session
      .flash({ success: antl.formatMessage('main.alert_success') })
    return response.redirect('back')
  }

  async update({ request, params, session, response, antl }) {
    const data = request.only(['score_visibility', 'visible'])
    data.visible = !!data.visible

    let assignment = await Assignment.findOrFail(params.id)
    assignment.merge(data)
    await assignment.save()

    session
      .flash({ success: antl.formatMessage('main.alert_success') })
    return response.redirect('back')
  }
}

module.exports = AssignmentController
