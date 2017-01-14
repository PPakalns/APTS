'use strict'

const Group = use('App/Model/Group')
const Problem = use('App/Model/Problem')
const Assignment = use('App/Model/Assignment')
const Database = use('Database')

class AssignmentController {

  * show(req, res){

    const id = req.param('id')
    const assignment = yield Assignment.findOrFail(id)
    yield assignment.related('group', 'problem').load()

    let jsonAssignment = assignment.toJSON()

    yield res
      .sendView('problem/show',
        {
          inAssignment: true,
          assignment: jsonAssignment,
          problem: jsonAssignment.problem
        }
      )
  }

  * group_management(req, res){
    const groupid = req.param('group_id')
    const group = yield Group.findOrFail(groupid)

    const assignments = yield group.assignments().with('problem').fetch()

    yield res.sendView('assignment/manage', {group: group.toJSON(), assignments: assignments.toJSON()})
  }

  * create(req, res){
    const formData = req.only('group_id', 'problem_id')
    const group = yield Group.findOrFail(formData.group_id)
    const problem = yield Problem.findOrFail(formData.problem_id)

    const alreadyOwn = yield group.assignments().where('problem_id', problem.id).fetch()

    if (alreadyOwn.size() == 0)
    {
      const assignment = new Assignment();
      assignment.problem_id = problem.id;
      assignment.group_id = group.id;
      assignment.visible = true;
      yield assignment.save()

      yield req.with({successes: [{message:"Uzdevums jau grupai ir pievienots!"}]}).flash()
    }
    else
    {
      yield req.with({errors: [{message:"Uzdevums jau grupai ir pievienots!"}]}).flash()
    }

    res.route('group/assignment', {group_id: group.id})
  }

  * options_update(req, res){
    // When visibility or other assignment options are updated

    const formData = req.all();
    const group = yield Group.findOrFail(formData.group_id)

    let visible_tasks = []
    let visibility_regex = /^vis_(\d+)$/

    for (let property in formData) {
      if (formData.hasOwnProperty(property))
      {
        let key = property+''
        let match = key.match(visibility_regex)
        if (match)
        {
          visible_tasks.push(parseInt(match[1]));
        }
      }
    }

    const notVisibleAssignmentCount = yield Database
      .table('assignments')
      .update('visible', false)
      .where('group_id', group.id)
      .whereNotIn('id', visible_tasks)

    const visibleAssignmentCount = yield Database
      .table('assignments')
      .update('visible', true)
      .where('group_id', group.id)
      .whereIn('id', visible_tasks)

    yield req
      .with({successes:
        [
          {message: "Dati atjaunoti veiksmīgi!"},
          {message: "Grupas dalībniekiem redzami "+visibleAssignmentCount+" uzdevumi!"},
          {message: "Grupas dalībniekiem paslēpti "+notVisibleAssignmentCount+" uzdevumi!"},
        ]
      })
      .flash()

    res.route('group/assignment', {group_id: group.id})
  }
}

module.exports = AssignmentController
