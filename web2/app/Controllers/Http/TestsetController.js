'use strict'

const Testset = use('App/Models/Testset')
const Problem = use('App/Models/Problem')
const File = use('App/Models/File')
const Test = use('App/Models/Test')
const Helpers = use('Helpers')
const Antl = use('Antl')

const yauzl = require("yauzl");

class TestsetController {

  async edit ({ params, view }) {
    let testset = await Testset.findOrFail(params.id)
    let problem = await Problem.findOrFail(testset.problem_id)
    let checker = await testset.checker().fetch()
    let tests = await testset.tests().fetch()
    if (checker) checker = checker.toJSON()
    return view.render('testsets.edit', {testset: testset.toJSON(),
                                         problem: problem.toJSON(),
                                         checker,
                                         tests: tests.toJSON() })
  }

  async updateRestrictions ({ params, request, response, session, antl }) {
    const data = request.only(
      ['timelimit', 'memory', 'public_range', 'use_files',
       'input_file', 'output_file']
    )
    // Checkbox hack
    data.use_files = !!data.use_files

    let testset = await Testset.findOrFail(params.id)
    testset.merge(data)
    testset.updated += 1
    await testset.save()
    session.flash({success: antl.formatMessage('main.saved') })
    return response.route('TestsetController.edit', {id: testset.id})
  }

  async updateChecker (ctx) {
    let { params, response, session, antl } = ctx
    let testset = await Testset.findOrFail(params.id)
    let problem = await Problem.findOrFail(testset.problem_id)

    let checker_file = await File.upload(ctx, 'checker', ['text'], true, '64KB')
    if (!checker_file) {
      return
    }

    testset.checker_id = checker_file.id
    testset.updated += 1

    await testset.save()

    session.flash({success: antl.formatMessage('main.saved') })
    return response.route('TestsetController.edit', {id: testset.id})
  }

  async updateTests (ctx) {
    let { request, response, session, antl, params } = ctx
    let testset = await Testset.findOrFail(params.id)
    let problem = await Problem.findOrFail(testset.problem_id)

    let zip_file = await File.upload(ctx, 'tests', ['zip'], false, '100MB')
    if (!zip_file) {
      return
    }

    let tests;
    try {
      tests = await parseZipFile(zip_file)
    } catch (error) {
      await zip_file.delete()
      session.flash({ 'tests': error })
      return response.redirect('back')
    }

    let utestset = await newTestset(testset)

    utestset.zip_id = zip_file.id
    problem.testset_id = utestset.id

    for (let test of tests) {
      test.testset_id = utestset.id
    }

    await Test.createMany(tests)
    await utestset.save()
    await problem.save()

    session.flash({success: antl.formatMessage('main.saved') })
    return response.route('TestsetController.edit', {id: utestset.id})
  }

  async downloadChecker(ctx) {
    let params = ctx.params
    let testset = await Testset.findOrFail(params.id)
    let file = await File.findOrFail(testset.checker_id)

    await File.download(ctx, file)
  }

  async downloadTests(ctx) {
    let params = ctx.params
    let testset = await Testset.findOrFail(params.id)
    let file = await File.findOrFail(testset.zip_id)

    await File.download(ctx, file)
  }
}

/*
 * Helper function to initialize a updated copy of current testset
 */
async function newTestset(oldtestset) {
  let utestset = new Testset()
  let data = oldtestset.toJSON()
  delete data.id
  data.updated += 1
  return await Testset.create(data)
}

const yauzlOpen = Helpers.promisify(yauzl.open)
const TEST_PATTERN = /^(.+)\.(i|o)(\d{1,3})([A-Za-z]?)$/

function readTests(zipfile) {
  return new Promise(function(resolve, reject) {
    let tests = {}

    function readEntry(entry) {
      let testFileName = entry.fileName;
      let match = testFileName.match(TEST_PATTERN);
      if (match) {
        let testId = parseInt(match[ 3 ]) + match[ 4 ];
        if (tests.hasOwnProperty(testId) == false) {
          tests[testId] = {}
          tests[testId].tid = match[ 3 ]
          tests[testId].gid = match[ 4 ]
        }

        if (match[ 2 ] == "i") {
          tests[testId].input_file = match[ 0 ]
        } else if (match[ 2 ] == "o") {
          tests[testId].output_file = match[ 0 ]
        } else {
          zipfile.close()
          return reject(Antl.formatMessage('main.zip_bad_file', {filename: testFileName}))
        }
      }
      else
      {
        zipfile.close()
        return reject(Antl.formatMessage('main.zip_bad_file', {filename: testFileName}))
      }
      zipfile.readEntry()
    }

    function readEnd() {
      zipfile.close()
      resolve(tests)
    }

    zipfile.on("entry", readEntry)
    zipfile.on("error", reject)
    zipfile.once("end", readEnd)
    zipfile.readEntry()
  })
}

/*
 * Function which parses zip file and retrieves test files
 * Throws exception with message
 */
async function parseZipFile (zip_file) {
  let open_zip_file = await yauzlOpen(zip_file.path, {lazyEntries: true})
  let tests = await readTests(open_zip_file)

  let processed_tests = []
  for (let testId of Object.keys(tests)) {
    let test = tests[testId]
    if (test.hasOwnProperty("input_file") == false
        || test.hasOwnProperty("output_file") == false)
    {
      throw Antl.formatMessage("main.zip_does_not_contain_inout_files", {testname: testId})
    }
    processed_tests.push(test)
  }
  if (processed_tests.length == 0) {
    throw Antl.formatMessage("main.zip_empty")
  }

  processed_tests.sort((a, b) => {
    if (a.tid != b.tid)
      return a.tid - b.tid;
    if (a.gid != b.gid)
      return a.gid > b.gid ? 1 : -1;
    return 0;
  })

  return processed_tests
}

module.exports = TestsetController
