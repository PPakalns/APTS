'use strict'

const Group = use('App/Model/Group')
const Problem = use('App/Model/Problem')
const Assignment = use('App/Model/Assignment')
const Database = use('Database')
const Validator = use('Validator')

const score_vis_types = {
    0: "Publisko grupu rezultāts, publisko grupu testi detalizēti",
    4: "Pilnais rezultāts, publisko grupu testi detalizēti",
    8: "Pilnais rezultāts, visi testi, publiskie testi detalizēti",
    12: "Pilnais rezultāts, visi testi detalizēti"
}

class AssignmentController {

  * show(req, res){

    const id = req.param('assignment_id')
    const assignment = yield Assignment.findOrFail(id)
    yield assignment.related('group', 'problem', 'problem.testset').load()
    let jsonAssignment = assignment.toJSON()

    // Check if user is assigned to group
    const isParticipant =
        ((yield Database
          .table('user_group')
          .where('user_id', req.cUser.user.id)
          .where('group_id', jsonAssignment.group.id)
        ).length)

    if ((!isParticipant || !jsonAssignment.visible) && !req.cUser.admin)
    {
      yield req
        .with({errors: [{message: "Jums nav vajadzīgās tiesības, lai skatītu pieprasīto lapu."}]})
        .flash()

      res.route('group/list')
      return
    }

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

    yield res.sendView('assignment/manage',
      {
        group: group.toJSON(),
        assignments: assignments.toJSON(),
        score_vis_types
      }
    )
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
            assignmet.score_visibility = 0
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
        const id = req.param('id')
        let data = req.only('score_vis', 'vis');
        let assignment = yield Assignment.findOrFail(id)

        data.score_vis = Validator.sanitizor.toInt(data.score_vis, 10)
        data.vis = data.vis ? true : false;

        let errors = []

        // Validate submission type
        const validation = yield Validator.validate(data, Assignment.options_rules)
        if (validation.fails()) {
            errors.push.apply(errors, validation.messages())
        }

        if (errors.length > 0)
        {
            yield req.with({errors: errors}).flash()
            res.route('group/assignment', {group_id: assignment.group_id})
            return
        }

        assignment.score_visibility = data.score_vis
        assignment.visible = data.vis
        yield assignment.save()
        let problem = yield assignment.problem().fetch()


        yield req.with({successes: [{msg: "Uzstādījumi atjaunoti uzdevumam: " + problem.name }]}).flash()
        res.route('group/assignment', {group_id: assignment.group_id})
    }
}

module.exports = AssignmentController
