'use strict'

const Test = use('App/Model/Test')
const Problem = use('App/Model/Problem')
const Helpers = use('Helpers')
const Validator = use('Validator')
const Database = use('Database')
const antl = use('Antl')

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

    yield res.sendView('problem/show', {problem: problem.toJSON()})
  }

  * create(req, res) {
    yield res.sendView('problem/edit', {form_heading: "Izveidot uzdevumu", create: true})
  }

  * create_save(req, res) {
    let problemData = req.only('name', 'description', 'timelimit', 'memory')

    problemData.timelimit = Validator.sanitizor.toFloat(problemData.timelimit)
    problemData.memory = Validator.sanitizor.toInt(problemData.memory, '')

    var errors = []
    if (isNaN(problemData.timelimit))
      errors.push({message: "Norādiet laika limitu, piemēram, 0.2"})

    if (isNaN(problemData.memory))
      errors.push({message: "Norādiet atmiņas limitu kā naturālu skaitli, piemēram, 256"})

    if (errors.length>0)
    {
      yield req
        .withAll()
        .andWith({"errors": errors})
        .flash()
      res.route('problem/create')
      return
    }

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
    problem.name = problemData.name;
    problem.description = problemData.description;
    problem.timelimit = problemData.timelimit;
    problem.memory = problemData.memory;

    // TODO: Remove after middleware permission check creation
    const user = yield req.auth.getUser()
    if (user)
    {
      problem.author = user.id;
    }
    yield problem.save()

    yield req
        .withAll()
        .andWith({"successes": [{message:"Uzdevums veiksmīgi izveidots!"}]})
        .flash()
    res.route('problem/show', {id: problem.id})
  }

  * edit(req, res) {
    const id = req.param('id')
    const problem = yield Problem.findOrFail(id)

    yield res.sendView('problem/edit', {problem: problem.toJSON()})
  }

  * edit_save(req, res) {
    let problemData = req.only('id', 'name', 'description', 'timelimit', 'memory')
    const problem = yield Problem.findOrFail(problemData.id)

    problemData.timelimit = Validator.sanitizor.toFloat(problemData.timelimit)
    problemData.memory = Validator.sanitizor.toInt(problemData.memory, 10)

    var errors = []
    if (isNaN(problemData.timelimit))
      errors.push({message: "Norādiet laika limitu, piemēram, 0.2"})

    if (isNaN(problemData.memory))
      errors.push({message: "Norādiet atmiņas limitu kā naturālu skaitli, piemēram, 256"})

    if (errors.length>0)
    {
      yield req
        .withAll()
        .andWith({"errors": errors})
        .flash()
      res.route('problem/edit',{id: problemData.id})
      return
    }

    const validation = yield Validator.validate(problemData, Problem.rules)
    if (validation.fails())
    {
      yield req
        .withAll()
        .andWith({"errors": [{message:"Lūdzu norādiet uzdevuma nosaukumu."}]})
        .flash()
      res.route('problem/edit',{id: problemData.id})
      return
    }

    problem.name = problemData.name;
    problem.description = problemData.description;
    problem.timelimit = problemData.timelimit;
    problem.memory = problemData.memory;
    yield problem.save()

    yield req
        .withAll()
        .andWith({"successes": [{message:"Uzdevums veiksmīgi rediģēts"}]})
        .flash()
    res.route('problem/show', {id: problemData.id})
  }

  * test_list(req, res) {
    const id = req.param('id')
    const problem = yield Problem.findOrFail(id)

    const tests = yield problem.tests().orderBy('number', 'asc').orderBy('gid', 'asc').fetch()

    yield res.sendView('problem/test/list', {tests: tests.toJSON(), problem: problem.toJSON()})
  }

  * testfile_download(req, res) {
    const id =req.param('id')
    const problem = yield Problem.findOrFail(id)

    if (!problem.test_filename)
    {
      yield req
        .with({"errors": [{message:"Uzdevumam nav pievienots testu arhīvs"}]})
        .flash()
      res.route('problem/test/list', {id: problem.id})
      return
    }

    res.header('Content-type', problem.test_filemime)
    res.header('content-disposition', "attachment; filename=\""+problem.test_filename+"\"")
    res.download(Helpers.storagePath(problem.test_filepath))
  }

  * test_edit_save(req, res) {
    const data = req.only("id")
    const problem = yield Problem.findOrFail(data.id)

    // getting file instance
    const test_file = req.file('test_file', {
        maxSize: '100mb',
        allowedExtensions: ['zip']
    })

    if (!test_file){
      // User did not choose test file
      yield req
        .withAll()
        .andWith({'errors': [{message:"Norādiet pareizu testu failu."}]})
        .flash()
      res.route('problem/test/edit', {id: data.id})
      return
    }

    const storagePath = Helpers.storagePath()
    const newTestFileName = uuid.v4();

    yield test_file.move(storagePath, newTestFileName)

    if (!test_file.moved()) {
      // Could not upload test file
      yield req
        .withAll()
        .andWith({'errors': [{message:"Testu fails neatbilst ierobežojumiem. (Ierobežojumi: Līdz 100mb liels zip arhīvs)"}]})
        .flash()
      res.route('problem/test/edit', {id: data.id})
      return
    }

    // Zip file helper functions to parse zip filenames
    var getZipFile = function (path_to_zip) {
      return new Promise(function(resolve, reject){
        yauzl.open(path_to_zip, {lazyEntries: true}, function(err, zipfile) {
          if (err) reject(err);
          resolve(zipfile);
        })
      })
    }

    var getZipFileNamePromise = function(zipfile){
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
    let zipFile = yield getZipFile(test_file.uploadPath())
    let completedTests = []
    let completedTestsNumeric = []
    let badZipArchive = false

    while (true)
    {
      let testFile = yield getZipFileNamePromise(zipFile)
      if (!testFile)
      {
        break;
      }
      let testFileName = testFile.fileName;
      let isInput = testFileName.match(/^(.+)\.(i|o)([\d]+)([A-Za-z]*)$/);
      if (isInput){
        let testId = isInput[ 1 ] + "." + isInput[ 3 ] + isInput[ 4 ];
        if (completedTests.hasOwnProperty(testId) == false)
        {
          completedTests[testId] = {}
          completedTestsNumeric.push(completedTests[testId])

          completedTests[testId].number = isInput[ 3 ]
          completedTests[testId].gid = isInput[ 4 ]
        }

        if (isInput[ 2 ] == "i")
        {
          completedTests[testId].input_filename = isInput[ 0 ]
        }
        else if (isInput[ 2 ] == "o")
        {
          completedTests[testId].output_filename = isInput[ 0 ]
        }
      }
      else
      {
        badZipArchive = antl.formatMessage('messages.zip_bad_file', {filename: testFileName})
      }
    }

    for (let testId in completedTests)
    {
      if (completedTests.hasOwnProperty(testId))
      {
        if (completedTests[testId].hasOwnProperty("input_filename")==false
            || completedTests[testId].hasOwnProperty("output_filename")==false)
        {
          badZipArchive = antl.formatMessage('messages.zip_does_not_contain_inout_files', {testname: testId})
          break
        }
      }
    }

    if (badZipArchive)
    {
      yield req
        .withAll()
        .andWith({'errors': [{message: badZipArchive}]})
        .flash()
      res.route('problem/test/edit', {id: data.id})
      return
    }

    // Save tests to database
    yield problem.tests().delete()
    problem.test_filename = test_file.clientName()
    problem.test_filesize = test_file.clientSize()
    problem.test_filemime = test_file.mimeType()
    problem.test_filepath = newTestFileName;
    problem.test_count = completedTestsNumeric.length;
    yield problem.save()

    yield problem.tests().createMany(completedTestsNumeric)

    yield req
      .withAll()
      .andWith({'successes': [{message:"Augšupielāde izdevās"}]})
      .flash()

    res.route('problem/test/edit', {id: data.id})
    return
  }
}

module.exports = ProblemController
