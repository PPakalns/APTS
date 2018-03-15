'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.0/routing
|
*/

const Route = use('Route')

Route.on('/').render('index')
Route.get('signin', 'SessionController.create')
Route.post('signin', 'SessionController.store')
Route.get('signout', 'SessionController.delete').middleware('auth')
