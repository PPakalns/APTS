'use strict'

const Testset = use('App/Models/Testset')
const Problem = use('App/Models/Problem')

class TestsetController {

  async edit ({ params, view }) {
    let testset = await Testset.findOrFail(params.id)
    let problem = await Problem.findOrFail(testset.problem_id)
    return view.render('testsets.edit', {testset: testset.toJSON(),
                                         problem: problem.toJSON()})
  }

  async updateRestrictions ({ params, request, response, session, antl }) {
    const data = request.only(
      ['timelimit', 'memory', 'public_range', 'use_files',
       'input_file', 'output_file']
    )
    data.use_files = !!data.use_files
    console.log(data)

    let testset = await Testset.findOrFail(params.id)
    testset.merge(data)
    testset.updated += 1
    await testset.save()
    session.flash({success: antl.formatMessage('main.saved') })
    return response.route('TestsetController.edit', {id: testset.id})
  }

  static async newTestset(oldtestset) {
    let utestset = new Testset()
    {
      let data = oldtestset.toJSON()
      delete data.id
      utestset.merge()
    }
    utestset.updated += 1
    await utestset.save()
    return utestset
  }

  async updateChecker ({ params, response }) {
    let testset = await Testset.findOrFail(params.id)
    let problem = await Problem.findOrFail(testset.problem_id)

    // TODO: File upload

    let utestset = await newTestset(testset)

    // TODO
    // utestset.checker_id = checker_file.id
    problem.testset_id = utestset.id

    await utestset.save()
    await problem.save()

    return response.route('TestsetController.edit', {id: testset.id})
  }

  async updateTests ({ request, response }) {
    let testset = await Testset.findOrFail(params.id)
    let problem = await Problem.findOrFail(testset.problem_id)

    // TODO: File upload
    // TODO: Parse zip file and extract tests

    let utestset = await newTestset(testset)

    // TODO
    // utestset.zip_id =
    problem.testset_id = utestset.id

    await utestset.save()
    await problem.save()

    return response.route('TestsetController.edit', {id: testset.id})
  }
}

module.exports = TestsetController
