'use strict'

const Judge = use('App/Model/Judge')
const File = use('App/Model/File')
const Problem = use('App/Model/Problem')
const Submission = use('App/Model/Submission')
const Testresult = use('App/Model/Testresult')
const Utility = use('Utility')

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
        let body = req.all()
        let submission = yield Submission.findOrFail(body.submission_id)

        if (submission.status != 1)
        {
            throw Error("Judge: submission is not in testing state" + submission.status)
        }

        submission.judge_id = req.judge.id
        submission.status = body.status
        submission.public = body.public
        submission.private = body.private
        submission.score = body.score
        submission.maxscore = body.maxscore
        submission.maxtime = body.maxtime
        submission.maxmemory = body.maxmemory
        submission.testset_id = body.testset_id
        yield submission.save()

        let judge = req.judge;
        judge.tested = judge.tested + 1

        // Remove old testresults
        const affectedRows = yield Testresult.query()
                                   .where('submission_id', submission.id)
                                   .delete()

        // Prepare new testresults
        let testres = []

        for (let test of body.tests)
        {
            let res = {}
            for (let key in test)
            {
                if (test.hasOwnProperty(key))
                {
                    res[ key ] = test[ key ]
                }
            }
            res['submission_id'] = submission.id
            testres.push(res)
        }

        yield Utility.bulkInsert(Testresult, testres)
        yield judge.save()

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
            judge.status = "wait";
            yield judge.save()
            res.json({status: "wait"})
            return
        }

        const affectedRows = yield Database
            .table('submissions')
            .where('id', submission.id)
            .where('status', 0)
            .update('status', 1)

        if (affectedRows==0)
        {
            console.error("Race condition in JudgeController.getJob")
            judge.status = "wait";
            yield judge.save()
            res.json({status: "wait"})
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

        let publicset = Utility.getRangeSet(testset.public_range)

        let upd_tests = []
        for (let test of tests)
        {
            upd_tests.push({
                id: test.id,
                visible: publicset.hasOwnProperty(test.tid),
                in: test.input_file,
                out: test.output_file
            })
        }

        output = {
            status: 'ok',
            memory_limit: testset.memory,
            time_limit: testset.timelimit,
            checker_id: testset.checker_id,
            zip_id: testset.zip_id,
            testset_id: testset.id,
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
