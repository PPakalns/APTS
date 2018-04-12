'use strict'

const Antl = use('Antl')
const Assignment = use('App/Models/Assignment')
const Group = use('App/Models/Group')
const Problem = use('App/Models/Problem')
const Submission = use('App/Models/Submission')
const Validator = use('Validator')
const Database = use('Database')

let stringify = require('csv-stringify')
let moment = require('moment')
let archiver = require('archiver')

const score_vis_type_messages = {
  0:  Antl.formatMessage("main.assignment_vis_0"),  // public detailed
  4:  Antl.formatMessage("main.assignment_vis_4"),  // +full score
  8:  Antl.formatMessage("main.assignment_vis_8"),  // +all tests
  12: Antl.formatMessage("main.assignment_vis_12"), // +all tests detailed
}

const EXTENSIONS = {
    "cpp"   : "cpp",
    "cpp11" : "cpp",
    "c"     : "c",
    "c11"   : "c",
    "pas"   : "pas",
}

class AssignmentController {

  async show(ctx) {
    let { params, session, response, request, antl, view } = ctx
    let assignment = await Assignment.findOrFail(params.id)
    let group = await Group.findOrFail(assignment.group_id)
    let problem = await Problem.findOrFail(assignment.problem_id)
    await problem.load('testset')

    if ((await Assignment.checkViewPermission(ctx, assignment)) == false) {
      return
    }

    return view.render('problems.show',
      { problem: problem.toJSON(),
        assignment: assignment.toJSON(),
        group: group.toJSON(),
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

  async retestOld({ params, response, session, antl }) {
    let assignment = await Assignment.findOrFail(params.id)
    let problem = await assignment.problem().fetch()
    let testset = await problem.testset().fetch()

    const affectedRows = await Database
      .table('submissions')
      .update('status', 0)
      .update('testing_stage', 0)
      .where('assignment_id', assignment.id)
      .whereNot('testing_stage', 0)
      .where(function() {
        this.whereNot('testset_id', testset.id)
          .orWhereNot('testset_update', testset.updated)
      })

    session
      .flash({ success: antl.formatMessage('main.reevaluating_solutions', {cnt: affectedRows}) })
    return response.redirect('back')
  }

  async exportSubmissions(ctx) {
    let { params, request } = ctx
    let assignment = await Assignment.findOrFail(params.id)

    let till = request.only(['till']).till

    // Retrieve last OK submission id for all participants
    let query = Database
      .table('submissions')
      .max('id as maxsid')
      .where('status', 2)
      .where('assignment_id', assignment.id)
    if (till) {
      query = query.where('created_at', '<=', till)
    }
    query = query
      .groupBy('user_id')
      .orderBy("maxsid")

    let submissions = await query

    let ids = []
    for (let sub of submissions) {
      ids.push(sub["maxsid"])
    }

    await AssignmentController.exportSubmissionCsv(ctx, assignment, ids)
  }

  async exportSpecifiedSubmissions(ctx) {
    let { response, params, request, antl, session } = ctx
    let assignment = await Assignment.findOrFail(params.id)

    let data = request.only(['submission_ids'])
    let ids = (data.submission_ids + '').split(",").map(function(elem){return elem.trim()})

    let parsed_ids = []
    for (let id of ids)
    {
      let tid = id
      id = Validator.sanitizor.toInt(id, 10)
      if (isNaN(id)) {
        session.flash({ error: antl.formatMessage('main.not_an_integer', {value: tid}) })
        return response.redirect('back')
      }
      parsed_ids.push(id)
    }

    await AssignmentController.exportSubmissionCsv(ctx, assignment, parsed_ids)
  }

  static async exportSubmissionCsv({ response, antl, session }, assignment, submission_ids) {
    await assignment.loadMany(['group', 'problem', 'problem.testset.tests'])
    assignment = assignment.toJSON()

    // Populate submissions and validate that assignment owns them
    let submissions = []
    for (let sid of submission_ids) {
      let submission = await Submission.findOrFail(sid)
      if (submission.assignment_id != assignment.id) {
        session.flash({ error: antl.formatMessage('main.assignment_doesnt_own_submission',
                                             {submission_id: submission.id}) })
        return response.redirect('back')
      }
      await submission.loadMany(['testset', 'testresults', 'user', 'file'])
      submissions.push(submission.toJSON())
    }

    let columns = [
      'submission_id',
      'created_at',
      'status',
      'statusname',
      'problem_name',
      'group_name',
      'student_id',
      'email',
      'score',
      'maxscore',
      'test_count'
    ]

    let tests = []
    for (let test of assignment.problem.testset.tests) {
      tests.push({tid: test.tid, gid: test.gid, id: test.id})
    }

    // Sort tests in ascending order
    tests.sort((a, b) => {
      if (a.tid != b.tid)
        return a.tid - b.tid
      return a.gid.localeCompare(b.gid)
    })

    function getTid(test, suffix = "") {
      return test.tid + (test.gid || "") + suffix
    }

    function convertDate(dateStr)
    {
      try {
        return moment(dateStr, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY HH:mm:ss")
      } catch (err) {
        console.error(err)
        return dateStr
      }
    }

    let testIdToTest = {}
    for (let test of tests) {
      testIdToTest[test.id] = test
      columns.push(getTid(test)) // score
      columns.push(getTid(test, "_s")) // status
      columns.push(getTid(test, "_t")) // time
      columns.push(getTid(test, "_m")) // memory
    }

    response.header('Content-type', 'application/zip; charset=utf-8')
    response.header("Content-Disposition", "attachment;filename=task"+String(assignment.id)+".zip");

    let archive = archiver('zip', {
      zlib: {level: 9}
    });

    archive.pipe(response.response)

    let stringifier = stringify({ header: true, columns: columns })
    archive.append(stringifier, {name: 'results.csv'})

    for (let submission of submissions) {
      let ext = (EXTENSIONS.hasOwnProperty(submission.type)) ? EXTENSIONS[submission.type] : "unknown"
      archive.append(submission.file.file, {name: "submissions/" + submission.id + "." + ext})

      let data = {
        submission_id: submission.id,
        created_at: convertDate(submission.created_at),
        status: submission.status,
        statusname: submission.statusname,
        problem_name: assignment.problem.name,
        group_name: assignment.group.name,
        student_id: submission.user.student_id,
        email: submission.user.email,
        score: submission.score,
        maxscore: submission.maxscore,
        test_count: submission.testset.test_count,
      }

      for (let testResult of submission.testresults)
      {
        if (testIdToTest.hasOwnProperty(testResult.test_id) == false)
          continue
        testResult.test = testIdToTest[testResult.test_id]
        data[getTid(testResult.test)] = testResult.score
        data[getTid(testResult.test, "_s")] = testResult.status
        data[getTid(testResult.test, "_t")] = testResult.time
        data[getTid(testResult.test, "_m")] = testResult.memory / 1024.0 / 1024.0
      }
      stringifier.write(data)
    }

    function endS(){
      return new Promise(function(resolve, reject) {
        archive.on('finish', function(){
          resolve()
        })
        archive.on('error', function(err){
          archive.destroy()
          reject(err)
        })
        stringifier.end()
        archive.finalize()
      })
    }
    await endS()
  }

}

module.exports = AssignmentController
