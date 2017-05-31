'use strict'

const Test = use('App/Model/Test')
const File = use('App/Model/File')
const Testset = use('App/Model/Testset')
const Assignment = use('App/Model/Assignment')
const Submission = use('App/Model/Submission')
const Problem = use('App/Model/Problem')
const Helpers = use('Helpers')
const Validator = use('Validator')
const Database = use('Database')
const antl = use('Antl')
const Utility = use('Utility')

let uuid = require('node-uuid')
let yauzl = require("yauzl");

class ProblemController {


    * index (req, res) {
        const problems = yield Problem.query().with('creator').fetch();
        yield res.sendView('problem/list', {problems: problems.toJSON()});
    }


    // Returns list of problems which have search as substring
    * shortlist(req, res) {
        const search = ''+req.input('search')

        const users = yield Database
            .table('problems')
            .select('name', 'id')
            .whereRaw("INSTR(name,?) > 0",[search])
            .limit(10)

        res.json(users)
    }


    * show (req, res) {
        const id = req.param('id')
        const problem = yield Problem.findOrFail(id)
        yield problem.related('testset', 'testset.checker').load()

        yield res.sendView('problem/show', {problem: problem.toJSON()})
    }


    * create(req, res) {
        yield res.sendView('problem/edit', {form_heading: "Izveidot uzdevumu", create: true})
    }


    * create_save(req, res) {
        let problemData = req.only('name', 'description')

        const validation = yield Validator.validate(problemData, Problem.rules)
        if (validation.fails())
        {
            yield req
                .withAll()
                .andWith({"errors": validation.messages()})
                .flash()
            res.route('problem/create')
            return
        }

        const problem = new Problem()
        const user = yield req.auth.getUser()
        problem.name = problemData.name;
        problem.description = problemData.description;
        problem.author = user.id;
        yield problem.save()

        const testset = new Testset()
        testset.updated = 0
        testset.problem_id = problem.id
        testset.timelimit = 1
        testset.memory = 256
        yield testset.save()

        problem.testset_id = testset.id
        yield problem.save()

        yield req
            .withAll()
            .andWith({"successes": [{msg:"Uzdevums veiksmīgi izveidots!"}]})
            .flash()
        res.route('problem/show', {id: problem.id})
    }


    * edit(req, res) {
        const id = req.param('id')
        const problem = yield Problem.findOrFail(id)

        yield res.sendView('problem/edit', {problem: problem.toJSON()})
    }


    * edit_save(req, res) {
        let problemData = req.only('id', 'name', 'description')
        const problem = yield Problem.findOrFail(problemData.id)

        // Check problem validation rules
        const validation = yield Validator.validate(problemData, Problem.rules)
        if (validation.fails())
        {
            yield req.withAll()
                .andWith({"errors": [{message:"Lūdzu norādiet uzdevuma nosaukumu."}]}).flash()
            res.route('problem/edit',{id: problemData.id})
            return
        }

        problem.name = problemData.name;
        problem.description = problemData.description;
        yield problem.save()

        yield req.withAll().andWith({"successes": [{msg:"Uzdevums veiksmīgi rediģēts"}]}).flash()
        res.route('problem/show', {id: problemData.id})
    }


    * test_list(req, res) {
        const id = req.param('id')
        const problem = yield Problem.findOrFail(id)

        let json_testset = null

        let testset = yield Testset.findOrFail(problem.testset_id)
        yield testset.related('tests','zip','checker').load()
        json_testset = testset.toJSON()

        // Sort tests in increasing order
        json_testset.tests.sort(function(a, b){
            if (a.tid != b.tid)
                return a.tid - b.tid;
            return (a.gid || "").localeCompare(b.gid || "")
        })

        // Retrieves basic info about submissions
        let submissions = yield Database
             .table('submissions')
             .select('assignment_id', 'groups.name')
             .innerJoin('assignments', 'submissions.assignment_id', 'assignments.id')
             .innerJoin('groups', 'groups.id', 'assignments.group_id')
             .where('assignments.problem_id', problem.id)
             .groupBy('assignment_id', 'groups.name')
             .count()

        // Retrieves submissions that are tested with old testsets
        let oldsubmissions = yield Database
             .table('submissions')
             .select('assignment_id', 'groups.name')
             .innerJoin('assignments', 'submissions.assignment_id', 'assignments.id')
             .innerJoin('groups', 'groups.id', 'assignments.group_id')
             .where('assignments.problem_id', problem.id)
             .whereNot('status', 0)
             .where(function(){
                 this.whereNot('submissions.testset_id',  testset.id)
                     .orWhereNot('submissions.testset_update', testset.updated)
             })
             .groupBy('assignment_id', 'groups.name')
             .count()

        // Retrieves count of submissions that are being tested now
        let status_state = yield Database
            .table('submissions')
            .select('status')
            .innerJoin('assignments', 'submissions.assignment_id', 'assignments.id')
            .where('assignments.problem_id', problem.id)
            .groupBy('status')
            .count('* as cnt')

        for (let test of status_state)
        {
            test['name'] = Submission.getStatus(test['status'])
        }

        yield res.sendView('problem/test/list', {testset: json_testset, problem: problem.toJSON(), oldsubmissions, submissions, status_state})
    }


    * download_checker(req, res) {
        const id =req.param('testset_id')
        const testset = yield Testset.findOrFail(id)
        const checker = yield testset.checker().fetch()
        yield File.download(req, res, checker)
    }


    * download_zip(req, res) {
        const id =req.param('testset_id')
        const testset = yield Testset.findOrFail(id)
        const zip = yield testset.zip().fetch()
        yield File.download(req, res, zip)
    }

    * test_save_limits(req, res) {
        let data = req.only("id", "timelimit", "memory", "public_range", "use_files", "input_file", "output_file")
        const problem = yield Problem.findOrFail(data.id)

        let errors = []

        data['public_range'] = Utility.parseRangeStr(data['public_range'], errors)

        // Check memory and time limits
        checkLimits(errors, data)

        checkFiles(errors, data)

        if (errors.length > 0)
        {
            yield req.withAll().andWith({"errors": errors}).flash()
            res.route('problem/test/list',{id: data.id})
            return
        }

        let testset = yield problem.testset().fetch()
        testset.updated += 1
        testset.memory = data.memory
        testset.timelimit = data.timelimit
        testset.public_range = data.public_range
        testset.use_files = data.use_files
        testset.input_file = data.input_file
        testset.output_file = data.output_file

        yield testset.save()

        yield req.with({"successes": [{msg: antl.formatMessage("messages.limits_updated_successfully")}]}).flash()
        res.route('problem/test/list', {id: data.id})
    }


    * test_save_checker(req, res) {
        let data = req.only("id")
        const problem = yield Problem.findOrFail(data.id)

        let errors = []

        var checker_opt = {
            maxSize: '64kb'
        }

        let checker_file = null
        checker_file = yield File.uploadFile(req, 'checker_file', checker_opt, true)
        if (!checker_file)
        {
            errors.push({msg: antl.formatMessage("messages.failed_upload", {size: "64kb"})})
        }

        if (errors.length > 0)
        {
            if (checker_file)
                yield checker_file.delete()

            yield req.withAll().andWith({"errors": errors}).flash()
            return res.route('problem/test/list',{id: data.id})
        }

        // Update testset
        let testset = yield problem.testset().fetch()
        testset.updated += 1
        testset.checker_id = checker_file.id
        yield testset.save()

        yield req.with({"successes": [{msg: antl.formatMessage("messages.limits_updated_successfully")}]}).flash()
        res.route('problem/test/list', {id: data.id})
    }


    * test_save_tests(req, res) {
        let data = req.only("id")
        const problem = yield Problem.findOrFail(data.id)

        let errors = []
        var tests_opt = {
            maxSize: '100mb',
            allowedExtensions: ['zip']
        }

        let tests = [], zip_file = null
        zip_file = yield File.uploadFile(req, 'test_file', tests_opt)
        if (zip_file)
        {
            tests = yield parseZipFile(zip_file, errors)
        }
        else if (!zip_file)
        {
            errors.push({msg: antl.formatMessage("messages.failed_upload_ext", {file: "64kb", ext: "zip"})})
        }

        if (errors.length > 0)
        {
            if (zip_file)
                yield zip_file.delete()

            yield req.withAll().andWith({"errors": errors}).flash()
            return res.route('problem/test/list', {id: data.id})
        }

        // Update testset
        let testset = yield problem.testset().fetch()
        let ntestset = new Testset()
        Testset.copy(testset, ntestset)
        ntestset.updated = 0
        ntestset.zip_id = zip_file.id
        ntestset.test_count = tests.length
        yield ntestset.save()

        // Update tests
        for (let test of tests)
        {
            test.testset_id = ntestset.id
        }
        yield Utility.bulkInsert(Test, tests)

        // Update problem
        problem.testset_id = ntestset.id
        yield problem.save()

        yield req.with({"successes": [{msg:antl.formatMessage("messages.tests_updated_successfully")}]}).flash()
        return res.route('problem/test/list', {id: data.id})
    }

    * test_retest (req, res)
    {
        let id = req.param('id')
        let assignment_id = req.param('assignment_id')

        let problem = yield Problem.findOrFail(id)
        let assignment = yield Assignment.findOrFail(id)

        let testset = yield problem.testset().fetch()

        const affectedRows = yield Database
            .table('submissions')
            .update('status', 0)
            .update('testing_stage', 0)
            .where('assignment_id', assignment.id)
            .whereNot('testing_stage', 0)
            .where(function(){
                this.whereNot('testset_id',  testset.id)
                    .orWhereNot('testset_update', testset.updated)
            })

        yield req.with({"successes": [{msg: "Pārtestēs "+affectedRows+" risinājumus."}]}).flash()
        return res.redirect('back')
    }
}


/*
 * Function to check time and memory limits
 * return sarray of errors or null
 */
function checkLimits(errors, data)
{
    data.timelimit = Validator.sanitizor.toFloat(data.timelimit)
    data.memory = Validator.sanitizor.toInt(data.memory, 10)

    if (isNaN(data.timelimit))
    {
        errors.push({msg: "Norādiet laika limitu, piemēram, 0.2"})
    }
    else
    {
        if (false == (data.timelimit > 0 && data.timelimit <= 16))
        {
            errors.push({msg: "Laika limitam ir jābūt robežās ]0,16] sekundēm."})
        }
    }

    if (isNaN(data.memory))
    {
        errors.push({msg: "Norādiet atmiņas limitu kā naturālu skaitli, piemēram, 256"})
    }
    else
    {
        if (false == (data.memory > 0 && data.memory <= 1024))
        {
            errors.push({msg: "Atmiņas limitam ir jābūt robežās ]0,1024] MiB."})
        }
    }
}


/*
 * Function parses test zip archive and returns array of tests
 */
function* parseZipFile(zip_file, errors)
{
    // Zip file helper functions to parse zip filenames
    let getZipFile = function (path_to_zip) {
        return new Promise(function(resolve, reject){
            yauzl.open(path_to_zip, {lazyEntries: true}, function(err, zipfile) {
                if (err) reject(err);
                resolve(zipfile);
            })
        })
    }

    let getZipFileNamePromise = function(zipfile){
        return new Promise(function(resolve, reject){

            var callbackOnEnd = function(){
                removeListeners();
                resolve(null)
            }

            var callbackOnEntry = function(entry){
                removeListeners()
                resolve(entry)
            }
            function removeListeners()
            {
                zipfile.removeListener("entry", callbackOnEntry)
                zipfile.removeListener("end", callbackOnEnd)
            }

            zipfile.on("entry", callbackOnEntry)
            zipfile.once("end", callbackOnEnd)
            zipfile.readEntry();
        })
    }

    // Parse zip file content
    let open_zip_file = yield getZipFile(zip_file.path)
    let badZipArchive = false
    let completedTests = {} // Stores test data, that was uploaded with test zip archive

    while (true)
    {
        let testFile = yield getZipFileNamePromise(open_zip_file)
        if (!testFile)
        {
            break;
        }
        let testFileName = testFile.fileName;
        const patt = /^(.+)\.(i|o)(\d{1,3})([A-Za-z]?)$/
        let isInput = testFileName.match(patt);
        if (isInput){
            let testId = isInput[ 1 ] + "." + parseInt(isInput[ 3 ]) + isInput[ 4 ];
            if (completedTests.hasOwnProperty(testId) == false)
            {
                completedTests[testId] = {}

                completedTests[testId].tid = isInput[ 3 ]
                completedTests[testId].gid = isInput[ 4 ]
            }

            if (isInput[ 2 ] == "i")
            {
                completedTests[testId].input_file = isInput[ 0 ]
            }
            else if (isInput[ 2 ] == "o")
            {
                completedTests[testId].output_file = isInput[ 0 ]
            }
            else
            {
                errors.push({msg: antl.formatMessage('messages.zip_bad_file', {filename: testFileName})})
                break
            }
        }
        else
        {
            errors.push({msg: antl.formatMessage('messages.zip_bad_file', {filename: testFileName})})
            break
        }
    }

    let tests = []

    for (let testId in completedTests)
    {
        if (completedTests.hasOwnProperty(testId))
        {
            if (completedTests[testId].hasOwnProperty("input_file")==false
                || completedTests[testId].hasOwnProperty("output_file")==false)
            {
                errors.push({msg: antl.formatMessage('messages.zip_does_not_contain_inout_files', {testname: testId})})
                break
            }
            else
            {
                tests.push(completedTests[testId])
            }
        }
    }

    if (tests.length == 0)
    {
        errors.push({msg: antl.formatMessage('messages.zip_empty')})
    }

    return tests
}

function checkFiles(errors, data)
{
    if (data["use_files"])
    {
        data["use_files"] = true;

        try{
            // Remove whitespaces
            data.input_file = data.input_file.trim();
            data.output_file = data.output_file.trim();
        }catch(e){}

        let file_regex = /^[a-zA-Z]+\.[a-zA-Z]+$/;
        if (Validator.is.string(data["input_file"]) && Validator.is.regex(data["input_file"], file_regex) == false)
        {
            errors.push({msg: "Ievadfaila nosaukums neatbilst formātam \"[a-zA-Z]+\\.[a-zA-Z]+\""})
            return;
        }
        if (Validator.is.string(data["output_file"]) && Validator.is.regex(data["output_file"], file_regex) == false)
        {
            errors.push({msg: "Izvadfaila nosaukums neatbilst formātam \"[a-zA-Z]+\\.[a-zA-Z]+\""})
            return;
        }
        if (data.input_file.length >= 20 || data.output_file.length >= 20)
        {
            errors.push({msg: "Failu nosaukumiem ir jābūt īsākiem par 20 simboliem!"})
            return;
        }

        let extension_regex = /\.log$/;
        if (Validator.is.regex(data["input_file"], extension_regex) || Validator.is.regex(data["output_file"], extension_regex))
        {
            errors.push({msg: "Faila paplašinājums nedrīkst būt \"log\"!"})
            return;
        }
        if (data["input_file"] == data["output_file"])
        {
            errors.push({msg: "Ievadfaila un izvadfaila nosaukumi ir vienādi. Tiem ir jābūt dažādiem."})
            return;
        }
    }
    else
    {
        data["use_files"] = false;
        data["input_file"] = ""
        data["output_file"] = ""
    }
}

module.exports = ProblemController
