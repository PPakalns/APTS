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
const PageController = use('App/Http/Controllers/PageController')

Route.get('/', function * (req, res){
    let gen = (new PageController).show(req, res);
    yield gen;
}).as('home')

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
    Route.get('', 'UserController.index').as('user/list')
    Route.get('/short/:not_group_id?', 'UserController.shortlist').as('user/shortlist')
}).prefix('/users').middleware('admin')

Route.group('group', function(){
    Route.get('/', 'GroupController.index').as('group/list')
    Route.get('/show/:id', 'GroupController.show').as('group/show')
    Route.get('/assignment/:id', 'AssignmentController.show').as('assignment/show')
}).prefix('/group').middleware('auth')

Route.group('group forAdmin', function(){
    Route.get('/edit/:id', 'GroupController.edit').as('group/edit')
    Route.post('/edit/:id', 'GroupController.edit_save').as('group/edit_save')
    Route.get('/create/', 'GroupController.create').as('group/create')
    Route.post('/create/', 'GroupController.create_save').as('group/create_save')

    Route.get('/users/:id', 'GroupController.users').as('group/users')
    Route.post('/users/remove', 'GroupController.users_remove').as('group/users/remove')
    Route.post('/users/add', 'GroupController.users_add').as('group/users/add')
    Route.get('/assignments/manage/:group_id', 'AssignmentController.group_management').as('group/assignment')
    Route.post('/assignments/create', 'AssignmentController.create').as('assignment/create')
    Route.post('/assignments/options/update', 'AssignmentController.options_update').as('assignment/options/update')
}).prefix('/group').middleware('admin')

Route.group('problem forAdmin', function(){
    Route.get('', 'ProblemController.index').as('problem/list')
    Route.get('/show/:id', 'ProblemController.show').as('problem/show')
    Route.get('/create', 'ProblemController.create').as('problem/create')
    Route.post('/create', 'ProblemController.create_save').as('problem/create_save')
    Route.get('/edit/:id', 'ProblemController.edit').as('problem/edit')
    Route.post('/edit/:id', 'ProblemController.edit_save').as('problem/edit_save')

    Route.get('/test/list/:id', 'ProblemController.test_list').as('problem/test/list')
    Route.post('/test/limits/:id', 'ProblemController.test_save_limits').as('problem/test/limits')
    Route.post('/test/checker/:id', 'ProblemController.test_save_checker').as('problem/test/checker')
    Route.post('/test/tests/:id', 'ProblemController.test_save_tests').as('problem/test/tests')

    Route.get('/test/download/zip/:testset_id', 'ProblemController.download_zip').as('problem/download/zip')
    Route.get('/test/download/checker/:testset_id', 'ProblemController.download_checker').as('problem/download/checker')

    Route.get('/api/short/', 'ProblemController.shortlist').as('problem/shortlist')
}).prefix('/problem').middleware('admin')

Route.group('page', function(){
    Route.resource('page', 'PageController').only('show')
    Route.post('page/:id/destroy', 'PageController.destroy').middleware('admin')
    Route.resource('page', 'PageController').except('show','destroy').middleware('admin')
})

Route.group('judge', function(){
    Route.get('judge/get', 'JudgeController.getJob')
    Route.get('judge/stop', 'JudgeController.stop')
}).middleware('judge')

Route.post('/submit/:assignment_id', 'SubmissionController.submit').as('submission/submit').middleware('auth')
Route.get('/submission', 'SubmissionController.index').as('submission/list').middleware('admin')
Route.get('/submission/:id', 'SubmissionController.show').as('submission/show').middleware('auth')
