'use strict'

const Problem = use('App/Model/Problem')

class ProblemController {

  * index (req, res) {
    const problems = yield Problem.query().with('author').fetch();
    yield res.sendView('problem/list', {problems: problems.toJSON()});
  }

}

module.exports = ProblemController
