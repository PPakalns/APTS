'use strict'

const Problem = use('App/Model/Problem')
const Helpers = use('Helpers')
var uuid = require('node-uuid')

class ProblemController {

  * index (req, res) {
    const problems = yield Problem.query().with('creator').fetch();
    yield res.sendView('problem/list', {problems: problems.toJSON()});
  }

  * create(req, res) {
    yield res.sendView('problem/edit', {form_heading: "Izveidot uzdevumu", create: true})
  }

  * create_save(req, res) {


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
      res.route('problem/create')
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
      res.route('problem/create')
      return
    }

    const problem = new Problem()
    problem.name = "example"
    problem.description = "example"
    problem.test_filename = test_file.clientName()
    problem.test_size = test_file.clientSize()
    problem.test_filepath = new_test_filename;

    const user = yield req.auth.getUser()
    console.log(user)
    problem.author = user.id;
    console.log(problem)

    yield problem.save()

    res.route('problem/list')
  }
}

module.exports = ProblemController
