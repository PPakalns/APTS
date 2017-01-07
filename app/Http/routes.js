'use strict'

/*
|--------------------------------------------------------------------------
| Router
|--------------------------------------------------------------------------
|
| AdonisJs Router helps you in defining urls and their actions. It supports
| all major HTTP conventions to keep your routes file descriptive and
| clean.
|
| @example
| Route.get('/user', 'UserController.index')
| Route.post('/user', 'UserController.store')
| Route.resource('user', 'UserController')
*/

const Route = use('Route')

Route.on('/').render('welcome')

// = = = = = = = = = =
Route.get('/login', 'AuthController.index')
  .middleware('notauth')

Route.post('/login', 'AuthController.login')
  .middleware('notauth')

Route.get('/logout', 'AuthController.logout').as('logout')

// = = = = = = = = = =
Route.get('/register', 'RegisterController.index')
  .middleware('notauth')

Route.post('/register', 'RegisterController.register')
  .middleware('notauth')
