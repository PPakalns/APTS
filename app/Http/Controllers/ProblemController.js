'use strict'

const Test = use('App/Model/Test')
const Problem = use('App/Model/Problem')
const Helpers = use('Helpers')
const Validator = use('Validator')
const Database = use('Database')

var uuid = require('node-uuid')
var yauzl = require("yauzl");

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
    yield res.sendView('problem/edit', {form_heading: "Izveidot grupu", create: true})
  }

  * create_save(req, res) {
    const problemData = req.only('name', 'description')

    const validation = yield Validator.validate(problemData, Problem.rules)
    if (validation.fails())
    {
      yield req
        .withAll()
        .andWith({"errors": [{message:"Lūdzu norādiet uzdevuma nosaukumu."}]})
        .flash()
      res.route('problem/create')
      return
    }

    const problem = new Problem()
    problem.name = problemData.name;
    problem.description = problemData.description;

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
    const problemData = req.only('id', 'name', 'description')

    const validation = yield Validator.validate(problemData, Problem.rules)
    if (validation.fails())
    {
      yield req
        .withAll()
        .andWith({"errors": [{message:"Lūdzu norādiet uzdevuma nosaukumu."}]})
        .flash()
      res.route('problem/edit',{id: id})
      return
    }

    const problem = yield Problem.findOrFail(problemData.id)
    problem.name = problemData.name;
    problem.description = problemData.description;
    yield problem.save()

    yield req
        .withAll()
        .andWith({"successes": [{message:"Uzdevums veiksmīgi rediģēta"}]})
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

  * test_edit(req, res) {
    const id = req.param('id')
    const problem = yield Problem.findOrFail(id)
    yield res.sendView('problem/test/edit',{problem: problem.toJSON()})
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
          if (/\/$/.test(entry.fileName)) {
            // Skip directory
            zipfile.readEntry()
          } else {
            removeListeners()
            resolve(entry)
          }
        }
        function removeListeners()
        {
          zipfile.removeListener("entry", callbackOnEntry)
          zipfile.removeListener("end", callbackOnEnd)
        }

        zipfile.readEntry();

        zipfile.on("entry", callbackOnEntry)
        zipfile.once("end", callbackOnEnd)
      })
    }

    // Parse zip file content
    var zipFile = yield getZipFile(test_file.uploadPath())
    var completedTests = []
    var completedTestsNumeric = []

    while ( true )
    {
      var testFile = yield getZipFileNamePromise(zipFile);
      if (!testFile)
        break;
      var testFileName = testFile.fileName;
      var isInput = testFileName.match(/^(.+)\.(i|o)([\d]+)([A-Za-z]*)$/);
      if (isInput){
        var testId = isInput[ 1 ] + "." + isInput[ 3 ] + isInput[ 4 ];
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
    }

    // Save tests to database
    yield problem.tests().delete()
    problem.test_filename = test_file.clientName()
    problem.test_filesize = test_file.clientSize()
    problem.test_filemime = test_file.mimeType()
    problem.test_filepath = newTestFileName;
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
