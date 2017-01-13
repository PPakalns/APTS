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

  Route.get('/users/api/short', 'UserController.shortlist').as('user/shortlist')
})

Route.group('group', function(){
  Route.get('', 'GroupController.index').as('group/list')
  Route.get('/show/:id', 'GroupController.show').as('group/show')
  Route.get('/edit/:id', 'GroupController.edit').as('group/edit')
  Route.post('/edit/:id', 'GroupController.edit_save').as('group/edit_save')
  Route.get('/create/', 'GroupController.create').as('group/create')
  Route.post('/create/', 'GroupController.create_save').as('group/create_save')

  Route.get('/users/:id', 'GroupController.users').as('group/users')
  Route.post('/users/remove', 'GroupController.users_remove').as('group/users/remove')
  Route.post('/users/add', 'GroupController.users_add').as('group/users/add')
}).prefix('/group')

Route.group('problem', function(){
  Route.get('', 'ProblemController.index').as('problem/list')
  Route.get('/create', 'ProblemController.create').as('problem/create')
  Route.post('/create', 'ProblemController.create_save').as('problem/create_save')
  Route.get('/show/:id', 'ProblemController.show').as('problem/show')
}).prefix('/problem')
