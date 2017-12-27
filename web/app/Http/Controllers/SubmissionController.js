'use strict'

const Database = use('Database')
const Helpers = use('Helpers')
const Group = use('App/Model/Group')
const Assignment = use('App/Model/Assignment')
const Submission = use('App/Model/Submission')
const Testresult = use('App/Model/Testresult')
const Validator = use('Validator')
const File = use('App/Model/File')
const antl = use('Antl')

let stringify = require('csv-stringify');
let moment = require('moment')

function convertDate(dateStr)
{
    try
    {
        return moment(dateStr, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY HH:mm:ss")
    }
    catch (err)
    {
        console.error(err)
        return dateStr
    }
}

class SubmissionController {


    * index(req, res) {
        // Retrieve page number
        let page = Validator.sanitizor.toInt(req.param('page', 1), 10)
        page = isNaN(page) ? 1 : Math.max(page,1)

        let query = Submission.query().orderBy('id', 'desc').with('user', 'assignment.group', 'assignment.problem')
        if (!req.cUser.admin)
            query = query.where('user_id', req.cUser.user.id)
        let sub_paginated = yield query.paginate(page, 40)
        yield res.sendView('submission/index', {sub_paginated: sub_paginated.toJSON()})
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

        yield submission.related('file', 'testset', 'assignment','assignment.problem','assignment.group').load()
        let query= Testresult.with('test').where('submission_id', id)

        if (!req.cUser.admin && submission.assignment.score_visibility <= 4 )
            query = query.where('visible', true)

        // query = query.orderBy('tests.tid').orderBy('tests.gid');

        let tests = yield query.fetch()

        yield res.sendView('submission/show', {submission: submission.toJSON(), tests: tests.toJSON()})
    }


    * retest(req, res)
    {
        const id = req.param('id')
        const submission = yield Submission.findOrFail(id)

        if (submission.testing_stage > 0)
        {
            submission.status = 0
            submission.testing_stage = 0
            yield submission.save()
            yield req.with({successes:[{msg: "Risinājums tiks pārtestēts"}]}).flash()
        }
        else
        {
            yield req.with({error:[{msg: "Lai pārtestētu risinājumu, risinājumam ir jābūt notestētam."}]}).flash()
        }
        res.redirect('back')
    }


    * export(req, res)
    {
        const id = req.param('id')
        let submission = yield Submission.findOrFail(id)

        if (submission.status < 2)
        {
            yield req.with({error:[{msg: "Eksportēt uz csv nav iespējams, jo risinājums nav notestēts."}]}).flash()
            return res.redirect('back')
        }

        yield submission.related('testset', 'testresults.test', 'assignment.problem', 'assignment.group').load()
        submission = submission.toJSON()

        var columns = [
            'submission_id',
            'problem_name',
            'group_name',
            'created_at',
            'status',
            'score',
            'maxscore',
            'test_count'
        ]

        let data = {
            problem_name: submission.assignment.problem.name,
            group_name: submission.assignment.group.name,
            submission_id: submission.id,
            status: submission.status,
            score: submission.score,
            maxscore: submission.maxscore,
            test_count: submission.testset.test_count,
            created_at: convertDate(submission.created_at),
        }

        for (let testr of submission.testresults)
        {
            let tid = testr.test.tid + (testr.test.gid || "");
            let t_tid = tid + "_t"
            let m_tid = tid + "_m"
            let s_tid = tid + "_s"
            columns.push(tid)
            columns.push(s_tid)
            columns.push(t_tid)
            columns.push(m_tid)
            data[tid] = testr.score
            data[m_tid] = testr.memory / 1024.0 / 1024.0
            data[t_tid] = testr.time
            data[s_tid] = testr.status
        }

        let stringifier = stringify({ header: true, columns: columns })

        res.header('Content-type', 'application/csv; charset=utf-8')
        res.header("Content-Disposition", "attachment;filename="+String(submission.id)+".csv");
        stringifier.pipe(res.response)

        stringifier.write(data);
        stringifier.end();
    }


    * export_assignment(req, res)
    {
        const assignment_id = req.param('assignment_id')
        let assignment = yield Assignment.findOrFail(assignment_id)
        yield assignment.related('group', 'problem', 'problem.testset.tests').load()
        assignment = assignment.toJSON()

        // PREPARE COLUMNS FOR DATA OUPUT
        let columns = [
            'submission_id',
            'created_at',
            'problem_name',
            'group_name',
            'student_id',
            'email',
            'status',
            'score',
            'maxscore',
            'test_count'
        ]

        let testIdToTest = {} // Will hold info about tests

        for (let test of assignment.problem.testset.tests)
        {
            testIdToTest[ test.id ] = test

            let tid = test.tid + (test.gid || "");
            let t_tid = tid + "_t"
            let m_tid = tid + "_m"
            let s_tid = tid + "_s"
            columns.push(tid)
            columns.push(s_tid)
            columns.push(t_tid)
            columns.push(m_tid)
        }

        // Retrieve last OK submission id for all participants
        let submissions = yield Database
            .table('submissions as s1')
            .select('s1.id')
            .leftJoin('submissions as s2', function() {
                this.on('s1.user_id', 's2.user_id')
                    .andOn('s1.id', '<', 's2.id')
                    .andOn('s2.status', 2)
                    .andOn('s2.assignment_id', assignment.id)
            })
            .where('s1.status', 2)
            .where('s1.assignment_id', assignment.id)
            .whereNull('s2.id')

        // Prepare stream for output
        let stringifier = stringify({ header: true, columns: columns })

        res.header('Content-type', 'application/csv; charset=utf-8')
        res.header("Content-Disposition", "attachment;filename=task"+String(assignment.id)+".csv");
        stringifier.pipe(res.response)

        // ITERATE OVER DATA AND CONVERT TO CSV
        for (let idobj of submissions)
        {
            let id = idobj['id']

            let submission = yield Submission.findOrFail(id)
            yield submission.related('testset',
                                     'testresults',
                                     'user'
                                     )
                            .load()

            submission = submission.toJSON()

            let data = {
                problem_name: assignment.problem.name,
                group_name: assignment.group.name,
                submission_id: submission.id,
                status: submission.status,
                score: submission.score,
                maxscore: submission.maxscore,
                test_count: submission.testset.test_count,
                student_id: submission.user.student_id,
                email: submission.user.email,
                created_at: convertDate(submission.created_at),
            }

            for (let testr of submission.testresults)
            {
                if (testIdToTest.hasOwnProperty(testr.test_id) == false)
                    continue
                testr.test = testIdToTest[testr.test_id]

                let tid = testr.test.tid + (testr.test.gid || "");
                let t_tid = tid + "_t"
                let m_tid = tid + "_m"
                let s_tid = tid + "_s"
                data[tid] = testr.score
                data[m_tid] = testr.memory / 1024.0 / 1024.0
                data[t_tid] = testr.time
                data[s_tid] = testr.status
            }
            stringifier.write(data);
        }
        stringifier.end();
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
        let up_file = null

        // Validate submission type
        const validation = yield Validator.validate(data, Submission.rules)
        if (validation.fails()) {
            errors.push.apply(errors, validation.messages())
        }

        // Check permissions to submit solution
        if (req.cUser.admin == false)
        {
            // Check if user is assigned to group
            let isParticipant = yield Group.participant(req, jsonAssignment.group)

            // Check if assignment is visible
            const isVisible = (jsonAssignment.visible)

            // Check if group is public
            const isGroupPublic = jsonAssignment.group.public

            if (isGroupPublic && isVisible && !isParticipant)
            {
                // automatically add user to group (public group)
                isParticipant = true
                yield req.cUser.ruser.groups().attach([jsonAssignment.group.id])
            }

            if (!isParticipant)
            {
                errors.push({msg: antl.formatMessage("messages.no_permission")})
            }
        }

        // Allow user to submit only 1 submission per 60 sec
        if (errors.length == 0)
        {
            let last_submission = yield Submission.query().where('user_id', req.cUser.user.id).orderBy('created_at', 'desc').first()

            if (last_submission && !req.cUser.admin)
            {
                let diff = 60 - Math.floor((new Date() - Date.parse(last_submission.created_at)) / 1000)
                if (diff > 1)
                {
                    errors.push({msg: "Nākamo iesūtījumu varēsiet iesūtīt pēc " + diff + " sekundēm! Lūdzu mēģiniet vēlreiz!"})
                }
            }
        }

        if (errors.length == 0)
        {
            // Upload solution file
            var solution_opt = {maxSize: '64kb'}
            up_file = yield File.uploadFile(req, 'solution', solution_opt, true)
            if (!up_file)
            {
                errors.push({msg: antl.formatMessage("messages.submission_upload_failed", solution_opt)})
            }
        }

        if (errors.length > 0)
        {
            if (up_file)
                yield up_file.delete()

            yield req.with({errors: errors}).flash()
            res.route('assignment/show', {assignment_id: assignment.id})
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
        res.route('assignment/show', {assignment_id: assignment.id})
        return
    }
}

module.exports = SubmissionController
