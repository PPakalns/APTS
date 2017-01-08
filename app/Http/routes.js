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

Route.on('/').render('welcome').as('home')

Route.group('login', function(){
  Route.get('/login', 'AuthController.index').as('login')
  Route.post('/login', 'AuthController.login')
}).middleware('notauth')

Route.get('/logout', 'AuthController.logout').as('logout')

Route.group('register', function(){
  Route.get('/register', 'RegisterController.index').as('register')
  Route.post('/register', 'RegisterController.register')
}).middleware('notauth')

Route.group('users', function(){
  Route.get('/users', 'UserController.index').as('user/list')
})

Route.group('group', function(){
  Route.get('', 'GroupController.index').as('group/list')
  Route.get('/show/:id', 'GroupController.show').as('group/show')
  Route.get('/edit/:id', 'GroupController.edit').as('group/edit')
  Route.post('/edit/:id', 'GroupController.edit_save').as('group/edit_save')

  Route.get('/users/:id', 'GroupController.users').as('group/users')
  Route.post('/users/remove', 'GroupController.users_remove').as('group/users/remove')
}).prefix('/group')
