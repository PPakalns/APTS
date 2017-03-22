'use strict'

const Submission = use('App/Model/Submission')
const Validator = use('Validator')

class PopulateSubmissionSidebar {

    * handle (req, res, next) {

        if (req.cUser.auth)
        {
            const assignment_id = req.param('assignment_id')

            let squery = Submission.query()
                .where('user_id', req.cUser.user.id)
                .orderBy('submissions.id', 'desc')
                .with('assignment')
                .limit(10)

            if (Validator.is.string(assignment_id))
                squery = squery.where('assignment_id', assignment_id)

            let submissions = yield squery.fetch()

            req.localView.sidebar_submissions = submissions.toJSON()
        }

        yield next
    }

}

module.exports = PopulateSubmissionSidebar
