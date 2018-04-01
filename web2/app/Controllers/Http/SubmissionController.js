'use strict'

const Submission = use('App/Models/Submission')
const { sanitizor } = use('Validator')

class SubmissionController {

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
