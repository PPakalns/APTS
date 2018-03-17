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


