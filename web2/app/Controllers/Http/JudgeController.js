'use strict'

const Judge = use('App/Models/Judge')
const Database = use('Database')
const Submission = use('App/Models/Submission')
const Testresult = use('App/Models/Testresult')
const File = use('App/Models/File')
const Problem = use('App/Models/Problem')

const utility = require('../../../utility/utility.js')

const TESTING_STAGE = {
  0  : "WAIT"                ,
  4  : "PUBLIC_TESTING"      ,
  8  : "PUBLIC_DONE"         ,
  12 : "NON_PUBLIC_TESTING"  ,
  16 : "TESTING_DONE"        ,
}

const STAGE_WAIT = 0
const STAGE_PUBLIC = 4
const STAGE_WAIT_PRIVATE = 8
const STAGE_PRIVATE = 12
const STAGE_DONE = 16

const STAGE_DELTA = 4

class JudgeController {

  async status ({ view }) {
    let judges = await Judge.all()

    // Retrieves basic info about submissions
    let tmp_statistics = await Database
      .table('submissions')
      .select('testing_stage')
      .where('testing_stage', '<', 16)
      .groupBy('testing_stage')
      .count('* as cnt')

    let total = 0
    let statistics = []
    for (let row of tmp_statistics) {
      let tstage = row['testing_stage']
      let data = {}
      data.name = TESTING_STAGE[tstage] || tstage
      data.size = row['cnt']
      total += data.size
      statistics.push(data)
    }

    if (total == 0) {
      statistics.push({name: "TESTING_DONE", size: 1})
      total = 1
    }

    let colors = [
      'progress-bar-striped bg-success',
      'progress-bar-striped bg-info',
      'progress-bar-striped bg-warning',
      'progress-bar-striped bg-danger',
    ]

    let cid = 0
    for (let stats of statistics) {
      stats.width = Math.floor(100 * stats.size / total)
      stats.color = colors[cid]

      cid += 1
      if (cid == colors.length)
        cid = 0
    }

    return view.render('judges.status', { judges: judges.toJSON(), statistics, total})
  }

  async stop({ request, response }) {
    console.log("Stopping judge")
    let judge = clearJudge(judge)
    await clearJudge(judge)
    judge.status = "STOPPED"
    await judge.save()

    return response.json({status: 'ok'})
  }

  async getFile(ctx) {
    let { params } = ctx
    let file = await File.findOrFail(params.file_id)
    await File.download(ctx, file)
  }

  async submitResult({ request, response }) {
    let body = request.all()
    let submission = await Submission.findOrFail(body.submission_id)

    if (submission.testing_stage != STAGE_PUBLIC && submission.testing_stage != STAGE_PRIVATE) {
      throw Error("Judge: submission not in testing stage" + submission.id + " " + submission.status)
    }

    const inPublicStage = (submission.testing_stage == STAGE_PUBLIC)

    if (body.public_stage != inPublicStage) {
      throw Error("Judge and submission testing stages does not much" + submission.id + " " + submission.status)
    }

    submission.judge_id = request.judge.id
    submission.testset_id = body.testset_id
    submission.testset_update = body.testset_update
    submission.testing_stage += STAGE_DELTA

    if (inPublicStage) {
      if (body.status != 2) {
        // Skip private testing, testing status not OK
        submission.testing_stage = STAGE_DONE
      }
      submission.status_private = body.status
      submission.status = body.status
    } else {
      submission.status_private = body.status
    }

    submission.public = body.public
    submission.private = body.private

    if (inPublicStage) {
      submission.score = body.score
      submission.maxscore = body.maxscore
      submission.maxtime = body.maxtime
      submission.maxmemory = body.maxmemory

      submission.public_score = body.public_score
      submission.public_maxscore = body.public_maxscore
      submission.public_maxtime = body.public_maxtime
      submission.public_maxmemory = body.public_maxmemory
    } else {
      submission.score += body.score
      submission.maxscore += body.maxscore
      submission.maxtime = Math.max(submission.maxtime, body.maxtime)
      submission.maxmemory = Math.max(submission.maxmemory, body.maxmemory)
    }

    let judge = request.judge
    judge.tested += 1
    judge.ip = request.ip()

    // Remove old testresults
    const affectedRows = await Testresult
      .query()
      .where('submission_id', submission.id)
      .where('visible', inPublicStage)
      .delete()

    // Prepare new testresults
    let testres = []
    for (let test of body.tests)
    {
      let res = Object.assign({}, test)
      res['submission_id'] = submission.id
      testres.push(res)
    }

    await Testresult.createMany(testres)
    await judge.save()
    await submission.save()

    return response.json({status: "ok"})
  }

  async getJob({ request, response }) {
    let judge = request.judge

    await clearJudge(judge)

    let submission = await getJudgableSubmission()

    if (!submission) {
      judge.status = "wait"
      judge.submission_id = null
      await judge.save()
      return response.json({status: "wait"})
    }

    if (submission.testing_stage == STAGE_WAIT)
      submission.status = 1

    submission.testing_stage += STAGE_DELTA
    submission.judge_id = judge.id
    judge.submission_id = submission.id
    judge.status = "TESTING " + submission.id + " - " + String(TESTING_STAGE[submission.testing_stage])

    await judge.save()
    await submission.save()

    // Prepare json object about testing

    let output = {}
    const public_stage = submission.testing_stage == STAGE_PUBLIC

    let assignment = await submission.assignment().fetch()
    let problem = await assignment.problem().fetch()
    let testset = await problem.testset().fetch()
    let tests = (await testset.tests().fetch()).toJSON()

    let publicset = utility.getRangeSet(testset.public_range)

    let upd_tests = []
    for (let test of tests) {
      let visible = publicset.hasOwnProperty(test.tid)
      if (visible != public_stage)
        continue

      upd_tests.push({
        id: test.id,
        visible: visible,
        in: test.input_file,
        out: test.output_file,
      })
    }

    output = {
        status: 'ok',
        public_stage: public_stage,
        memory_limit: testset.memory,
        time_limit: testset.timelimit,
        checker_id: testset.checker_id,
        zip_id: testset.zip_id,
        testset_id: testset.id,
        testset_update: testset.updated,
        use_files: testset.use_files,
        input_file: testset.input_file,
        output_file: testset.output_file,
        submission: {
            id: submission.id,
            type: submission.type,
            solution_id: submission.file_id
        },
        tests: upd_tests
    }

    return response.json(output)
  }
}

async function getJudgableSubmission() {
    // Testing priorities
    //  1. Evaluate public tests
    //  2. Evaluate non public tests

    let submission = await Submission.query().where('testing_stage', STAGE_WAIT).first();

    if (!submission)
        submission = await Submission.query().where('testing_stage', STAGE_WAIT_PRIVATE).first();

    return submission
}

/*
 * Clear judge testing state
 */
async function clearJudge(judge) {
  if (judge.submission_id)
  {
    let submission = await judge.submission().fetch()
    if (submission.status <= 1) // See app/Model/Submission.js
    {
      submission.judge_id = null
      submission.status = 0
      submission.testing_stage = 0
      await submission.save()
    }
    judge.submission_id = null
    await judge.save()
  }
}

module.exports = JudgeController
