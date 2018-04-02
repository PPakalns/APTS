'use strict'

const Problem = use('App/Models/Problem')
const Testset = use('App/Models/Testset')

class ProblemController {

  async index ({ view }) {
    const problems = await Problem.all()
    return view.render('problems.index', { problems: problems.toJSON() })
  }

  async show ({ view, params }) {
    const problem = await Problem.findOrFail(params.id)
    await problem.load('testset')
    return view.render('problems.show', { problem: problem.toJSON() })
  }

  async create ({ view }) {
    return view.render('problems.create')
  }

  async store ({ request, auth, response }) {
    const data = request.only(['name', 'description'])

    let user = await auth.getUser()

    // Create problem
    let problem = new Problem()
    problem.merge(data)
    problem.author = user.id
    await problem.save()

    // Create default testset for problem
    let testset = new Testset()
    testset.updated = 0
    testset.problem_id = problem.id
    testset.timelimit = 1
    testset.memory = 256
    await testset.save()

    // Assign default testset as default for problem
    problem.testset_id = testset.id
    await problem.save()

    return response.route('ProblemController.show', {id: problem.id})
  }

  async edit ({ params, view }) {
    const problem = await Problem.findOrFail(params.id)
    return view.render('problems.edit', { problem: problem.toJSON() })
  }

  async update ({ params, request, response }) {
    const data = request.only(['name', 'description'])
    let problem = await Problem.findOrFail(params.id)
    problem.merge(data)
    await problem.save()
    return response.route('ProblemController.show', {id: problem.id})
  }
}

module.exports = ProblemController
