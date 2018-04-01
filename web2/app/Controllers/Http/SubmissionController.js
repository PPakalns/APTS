'use strict'

const Submission = use('App/Models/Submission')
const { sanitizor } = use('Validator')

class SubmissionController {

  async show({ params, request, session, response, auth, view }) {
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

  async index({params, auth, view}) {
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
}

module.exports = SubmissionController
