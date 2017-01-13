'use strict'

const Problem = use('App/Model/Problem')
const Helpers = use('Helpers')
const Validator = use('Validator')
var uuid = require('node-uuid')
var yauzl = require("yauzl");

class ProblemController {

  * index (req, res) {
    const problems = yield Problem.query().with('creator').fetch();
    yield res.sendView('problem/list', {problems: problems.toJSON()});
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

  * test_edit(req, res) {
    const id = req.param('id')
    const problem = yield Problem.findOrFail(id)
    yield res.sendView('problem/test/edit',{problem: problem.toJSON()})
  }

  * test_edit_save(req, res) {
    const data = req.only("id")

    // getting file instance
    const test_file = req.file('test_file', {
        maxSize: '100mb',
        allowedExtensions: ['zip']
    })

    if (!test_file){
      // Nav norādīts testa fails
      yield req
        .withAll()
        .andWith({'errors': [{message:"Norādiet pareizu testu failu."}]})
        .flash()
      res.route('problem/test/edit', {id: data.id})
      return
    }

    const storagePath = Helpers.storagePath()
    const new_test_filename = uuid.v4();

    yield test_file.move(storagePath, new_test_filename)

    if (!test_file.moved()) {
      // Testa faila augšupielādes problēmas
      yield req
        .withAll()
        .andWith({'errors': [{message:"Testu fails neatbilst ierobežojumiem. (Ierobežojumi: Līdz 100mb liels zip arhīvs)"}]})
        .flash()
      console.log(test_file.errors())
      res.route('problem/test/edit', {id: data.id})
      return
    }
    yield req
      .withAll()
      .andWith({'successes': [{message:"Augšupielāde izdevās"}]})
      .flash()

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

    var zipfile = yield getZipFile(test_file.uploadPath())
    console.log(zipfile)

    while ( true )
    {
      var filename = yield getZipFileNamePromise(zipfile);
      if (!filename)
        break;
      console.log(filename.fileName)
    }

    res.route('problem/test/edit', {id: data.id})
    return
  }
}

module.exports = ProblemController
