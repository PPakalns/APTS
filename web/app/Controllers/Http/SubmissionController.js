'use strict'

const Submission = use('App/Models/Submission')
const Assignment = use('App/Models/Assignment')
const Group = use('App/Models/Group')
const File = use('App/Models/File')
const AssignmentController = use('App/Controllers/Http/AssignmentController')
const { sanitizor } = use('Validator')

class SubmissionController {

  async show({ params, request, session, response, auth, view, antl }) {
    let submission = await Submission.findOrFail(params.id)
    await submission.loadMany(
      ['assignment.group', 'assignment.problem', 'file', 'testresults.test',
       'user', 'testset']
    )
    let user = await auth.getUser()

    if (!request.roles.admin && submission.user_id != user.id) {
      session
        .flash({ error: antl.formatMessage('main.no_permissions') })
      return response.redirect('back')
    }

    submission = submission.toJSON()
    // Sort tests in ascending order
    submission.testresults.sort((a, b) => {
      if (a.test.tid != b.test.tid)
        return a.test.tid - b.test.tid
      return a.test.gid.localeCompare(b.test.gid)
    })

    return view.render('submissions.show', { submission })
  }

  async index({ params, auth, view }) {
    let page = sanitizor.toInt(params.page, 10)
    page = isNaN(page) ? 1 : Math.max(page, 1)

    let user = await auth.getUser()
    let submissions = await user
      .submissions()
      .with('assignment.group')
      .with('assignment.problem')
      .with('user')
      .orderBy('id', 'desc')
      .paginate(page, 20)

    return view.render('submissions.index', { submissions: submissions.toJSON() })
  }

  async indexAll({ params, auth, view }) {
    let page = sanitizor.toInt(params.page, 10)
    page = isNaN(page) ? 1 : Math.max(page, 1)

    let submissions = await Submission
      .query()
      .with('assignment.group')
      .with('assignment.problem')
      .with('user')
      .orderBy('id', 'desc')
      .paginate(page, 20)

    return view.render('submissions.indexAll', { submissions: submissions.toJSON() })
  }

  async store(ctx) {
    let { request, response, params, session, auth, antl } = ctx
    let assignment = await Assignment.findOrFail(params.assignment_id)
    let group = await assignment.group().fetch()
    let user = await auth.getUser()
    let data = request.only(['type']) // Validated in validator

    if ((await Assignment.checkViewPermission(ctx, assignment)) == false) {
      return
    }

    // 60 sec delay between submissions
    let last_submission = await user.submissions().orderBy('created_at', 'desc').first()
    if (last_submission && !request.roles.admin)
    {
      if ((new Date() - Date.parse(last_submission.created_at)) < 60 * 1000)
      {
        session
          .flash({error: antl.formatMessage('main.alert_submission_rate')})
        return response.redirect('back')
      }
    }

    // Upload solution
    let solution = await File.upload(ctx, 'solution', ['text', 'octet-stream'], true, '64KB')
    if (!solution) {
      return
    }

    if (!request.roles.admin && (await Group.isParticipant(user, group)) == false) {
      // Public group - attach user as participant
      await user.groups().attach([group.id])
    }

    const submission = new Submission()
    submission.user_id = user.id
    submission.assignment_id = assignment.id
    submission.status = 0
    submission.type = data.type
    submission.file_id = solution.id
    await submission.save()

    session
      .flash({success: antl.formatMessage('main.submission_accepted')})
    return response.redirect('back')
  }

  async retest({ params, response }) {
    let submission = await Submission.findOrFail(params.id)
    if (submission.testing_stage > 0)
    {
      submission.status = 0
      submission.testing_stage = 0
      await submission.save()
    }
    return response.redirect('back')
  }

  async export(ctx) {
    let { params } = ctx
    let submission = await Submission.findOrFail(params.id)
    let assignment = await submission.assignment().fetch()

    await AssignmentController.exportSubmissionCsv(ctx, assignment, [submission.id])
  }
}

module.exports = SubmissionController
