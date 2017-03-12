'use strict'

const Database = use('Database')
const Helpers = use('Helpers')
const Assignment = use('App/Model/Assignment')
const Submission = use('App/Model/Submission')
const Testresult = use('App/Model/Testresult')
const Validator = use('Validator')
const File = use('App/Model/File')
const antl = use('Antl')

class SubmissionController {


    * index(req, res) {
        let submissions = yield Submission.query().with('user', 'assignment', 'file', 'assignment.group', 'assignment.problem').fetch()
        yield res.sendView('submission/index', {submissions: submissions.toJSON()})
    }


    * show(req, res) {
        const id = req.param('id')
        const submission = yield Submission.findOrFail(id)

        if ( submission.user_id != req.cUser.user.id && !req.cUser.admin )
        {
            yield req
                .with({errors: [{message:"Jums nav atļaujas skatīt pieprasīto iesūtījumu."}]})
                .flash()
            res.redirect('back')
            return
        }

        const tests = yield Testresult.with('test').where('submission_id', id).fetch()

        yield submission.related('file', 'assignment','assignment.problem','assignment.group').load()
        yield res.sendView('submission/show', {submission: submission.toJSON(), tests: tests.toJSON()})
    }


    /*
     * Submit user solution program file / Create submission
     */
    * submit(req, res) {
        const assignmentId = req.param("assignment_id")
        const data = req.only('type')
        const assignment = yield Assignment.findOrFail(assignmentId)
        yield assignment.related('group', 'problem').load()
        let jsonAssignment = assignment.toJSON()

        let errors = []

        // Validate submission type
        const validation = yield Validator.validate(data, Submission.rules)
        if (validation.fails()) {
            errors.push.apply(errors, validation.messages())
        }

        // Check if user is assigned to group
        const isParticipant =
            ((yield Database
                .table('user_group')
                .where('user_id', req.cUser.user.id)
                .where('group_id', jsonAssignment.group.id)
            ).length)

        // Check if assignment is visible and user is participant in group
        const permission = ((isParticipant && jsonAssignment.visible) || req.cUser.admin)
        if (permission == false)
        {
            errors.push({msg: antl.formatMessage("messages.no_permission")})
        }

        // Upload solution file
        var solution_opt = {maxSize: '64kb'}
        let up_file = yield File.uploadFile(req, 'solution', solution_opt, true)
        if (!up_file)
        {
            errors.push({msg: antl.formatMessage("messages.submission_upload_failed")})
        }

        if (errors.length > 0)
        {
            if (up_file)
                yield up_file.delete()

            yield req.with({errors: errors}).flash()
            res.route('assignment/show', {id: assignment.id})
            return
        }

        const submission = new Submission()
        submission.user_id = req.cUser.user.id;
        submission.assignment_id = assignment.id;
        submission.status = 0;
        submission.type = data.type
        submission.file_id = up_file.id
        yield submission.save()

        yield req.withAll()
            .andWith({'successes': [{msg: antl.formatMessage("messages.submission_submitted")}]}).flash()
        res.route('assignment/show', {id: assignment.id})
        return
    }
}

module.exports = SubmissionController
