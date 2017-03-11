'use strict'

const Judge = use('App/Model/Judge')
const File = use('App/Model/File')
const Problem = use('App/Model/Problem')
const Submission = use('App/Model/Submission')

class JudgeController {

    * stop(req, res)
    {
        let judge = req.judge;
        yield clearJudge(judge)

        judge.status = "NOT WORKING"
        yield judge.save()

        res.json({status: "ok"})
    }

    * getFile(req, res)
    {
        const id = req.param('file_id')
        let file = yield File.find(id)
        yield File.download(req, res, file)
    }


    /*
     * Judge submit testing results to this function
     */
    * submitResult(req, res)
    {
        res.json({status: "ok"})
    }

    /*
     * Send json about one judgable submission
     */
    * getJob(req, res)
    {
        let judge = req.judge;

        yield clearJudge(judge)

        let submission = yield Submission.getJudgableSubmission()

        // No submission
        if (!submission)
        {
            res.json({status: "wait"})
            judge.status = "wait";
            yield judge.save()
            return
        }

        submission.status = 1
        submission.judge_id = judge.id
        judge.submission_id = submission.id
        judge.status = "TESTING " + submission.id
        yield judge.save()
        yield submission.save()

        // Prepere json object about testing

        let output = {}

        let assignment = yield submission.assignment().fetch()
        let problem = yield assignment.problem().fetch()
        let testset = yield problem.testset().fetch()
        let tests = yield testset.tests().fetch()

        let upd_tests = []
        for (let test of tests)
        {
            upd_tests.push({id: test.id, in: test.input_file, out: test.output_file})
        }

        output = {
            status: 'ok',
            memorylimit: testset.timelimit,
            timelimit: testset.memory,
            checker_id: testset.checker_id,
            zip_id: testset.zip_id,
            submission: {
                id: submission.id,
                type: submission.type,
                solution_id: submission.file_id
            },
            tests: upd_tests
        }

        res.json(output)
    }
}


/*
 * Sets submission which judge was testing to waiting status
 */
function * clearJudge(judge)
{
    if (judge.submission_id)
    {
        let submission = yield judge.submission().fetch()
        if (submission.status <= 1) // See app/Model/Submission.js
        {
            submission.judge_id = null
            submission.status = 0
            yield submission.save()
        }
        judge.submission_id = null
        yield judge.save()
    }
}

module.exports = JudgeController
