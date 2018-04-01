'use strict'

const Route = use('Route')

Route.get('/', async ({ response, session, view }) => {
  // By redirecting user to page, flash messages are lost. Save them!
  session.flash(view._locals.flashMessages)
  return response.route('PageController.show', {path: 'apts'})
})

// Sign in, out routes
Route.get('signin', 'SessionController.create')
Route.post('signin', 'SessionController.store')
Route.get('signout', 'SessionController.delete').middleware('auth')

// User sign up routes
Route.get('signup', 'UserController.create')
Route.post('signup', 'UserController.store').validator('StoreUser')
Route.get('signup/activate/:token/:key', 'UserController.activate')
Route.post('signup/activate', 'UserController.storeActivate').validator('ActivateUser')

// Page routes
Route.get('page/show/:path', 'PageController.show')

Route.group(() => {
  Route.get('/', 'PageController.index')
  Route.get('create', 'PageController.create')
  Route.post('create', 'PageController.store').validator('PageStore')
  Route.get('edit/:id', 'PageController.edit')
  Route.post('update/:id', 'PageController.update').validator('PageStore')
  Route.get('delete/:id', 'PageController.delete')
}).middleware(['admin']).prefix('page')

// Groups routes
Route.get('group/show/:id', 'GroupController.show')
Route.get('group/', 'GroupController.index')

Route.group(() => {
  Route.get('create', 'GroupController.create')
  Route.post('create', 'GroupController.store').validator('GroupStore')
  Route.get('edit/:id', 'GroupController.edit')
  Route.post('update/:id', 'GroupController.update').validator('GroupStore')

  // Participation management routes
  Route.get('participants/show/:id', 'GroupController.participants')
  Route.get('participants/add/:id/:user_id', 'GroupController.addParticipant')
  Route.get('participants/remove/:id/:user_id', 'GroupController.removeParticipant')

}).middleware(['admin']).prefix('group')

// Problem routes
Route.post('problem/:id/update', 'ProblemController.update')
  .middleware(['admin'])
  .validator('ProblemStore')

Route.resource('problem', 'ProblemController')
  .except(['destroy', 'update'])
  .middleware(['admin'])
  .validator(new Map([[['problem.store'], ['ProblemStore']]]))

// Testset routes
Route.group(() => {
  Route.get('checker/:id', 'TestsetController.downloadChecker')
  Route.get('tests/:id', 'TestsetController.downloadTests')
  Route.get('edit/:id', 'TestsetController.edit')
  Route.post('restrictions/:id', 'TestsetController.updateRestrictions').validator('TestsetRestrictionUpdate')
  Route.post('checker/:id', 'TestsetController.updateChecker')
  Route.post('tests/:id', 'TestsetController.updateTests')
}).middleware(['admin']).prefix('testset')

// Assignment routes
Route.get('assignment/:id', 'AssignmentController.show')
Route.group(() => {
  Route.get('edit/:group_id', 'AssignmentController.edit')
  Route.get('add/:group_id/:problem_id', 'AssignmentController.store')
  Route.post('update/:id', 'AssignmentController.update').validator('AssignmentStore')
}).middleware(['admin']).prefix('assignments')

Route.get('submissions/:page?', 'SubmissionController.index').middleware(['auth'])
