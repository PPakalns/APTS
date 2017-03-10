'use strict'

const Database = use('Database')
const Helpers = use('Helpers')
const Assignment = use('App/Model/Assignment')
const Submission = use('App/Model/Submission')

class SubmissionController {

  * index(req, res) {
      let submissions = yield Submission.query().with('user', 'assignment', 'file', 'assignment.group', 'assignment.problem').fetch()
      yield res.sendView('submission/index', {submissions: submissions.toJSON()})
  }

  * show(req, res) {
    const id = req.param('id')
    const submission = yield Submission.findOrFail(id)

    if ( submission.user_id != req.cUser.user.id && !req.cUser.admin )
    {
      yield req
        .with({errors: [{message:"Jums nav atļaujas skatīt pieprasīto iesūtījumu."}]})
        .flash()
      res.redirect('back')
      return
    }

    yield submission.related('assignment','assignment.problem','assignment.group').load()

    yield res.sendView('submission/show', {submission: submission.toJSON()})
  }

  * submit(req, res) {
    const assignmentId = req.param("assignment_id")
    const assignment = yield Assignment.findOrFail(assignmentId)
    yield assignment.related('group', 'problem').load()
    let jsonAssignment = assignment.toJSON()

    // Check if user is assigned to group
    const isParticipant =
        ((yield Database
          .table('user_group')
          .where('user_id', req.cUser.user.id)
          .where('group_id', jsonAssignment.group.id)
        ).length)

    // Check if assignment is visible and user is participant in group
    if ((!isParticipant || !jsonAssignment.visible) && !req.cUser.admin)
    {
      yield req
        .with({errors: [{message: "Jums nav vajadzīgās tiesības, lai iesūtītu risinājumu."}]})
        .flash()

      res.route('group/show', {id: jsonAssignment.group.id})
      return
    }

    // getting file instance
    const file = req.file('solution', {
        maxSize: '64kb',
        allowedExtensions: ['cpp']
    })

    if (!file){
      // User did not choose test file
      yield req
        .withAll()
        .andWith({'errors': "Faila augšupielāde neizdevās."})
        .flash()
      res.route('assignment/show', {id: jsonAssignment.id})
      return
    }
    const storagePath = Helpers.storagePath()
    const newTestFileName = uuid.v4() + "_s";

    yield file.move(storagePath, newTestFileName)

    if (!file.moved()) {
      // Could not upload test file
      console.log("Failed upload: ", req.cUser.user.email,"FILE:", file.errors())
      yield req
        .withAll()
        .andWith({'errors': [{message:"Augšupielādējamajam failam ir jābūt līdz 64kb lielam cpp failam, mēģiniet vēlreiz."}]})
        .flash()
      res.route('assignment/show', {id: jsonAssignment.id})
      return
    }

    const submission = new Submission()
    submission.user_id = req.cUser.user.id;
    submission.assignment_id = assignment.id;
    submission.status = 0;
    submission.filename = file.clientName()
    submission.filemime = file.mimeType()
    submission.filesize = file.clientSize()

    throw Error("not implemented")

    // Delete uploaded file
    yield unlinkFile(file.uploadPath())

    yield submission.save()

    yield req
      .withAll()
      .andWith({'successes': [{message:"Risinājums augšupielādēts testēšanai."}]})
      .flash()

    res.route('assignment/show', {id: jsonAssignment.id})
    return
  }
}

module.exports = SubmissionController
