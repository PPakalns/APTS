'use strict'

const Group = use('App/Model/Group')
const Problem = use('App/Model/Problem')
const Assignment = use('App/Model/Assignment')

class AssignmentController {

  * group_management(req, res){
    const groupid = req.param('group_id')
    const group = yield Group.findOrFail(groupid)

    const assignments = yield group.assignments().with('problem').fetch()

    yield res.sendView('assignment/manage', {group: group.toJSON(), assignments: assignments.toJSON()})
  }

  * create(req, res){
    const formdata = req.only('group_id', 'problem_id')
    const group = yield Group.findOrFail(formdata.group_id)
    const problem = yield Problem.findOrFail(formdata.problem_id)

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

  * update_options(req, res){
    // When visibility or other assignment options are updated

  }
}

module.exports = AssignmentController
