'use strict'

const Middleware = use('Middleware')

/*
|--------------------------------------------------------------------------
| Global Middleware
|--------------------------------------------------------------------------
|
| Global middleware are executed on every request and must be defined
| inside below array.
|
*/
const globalMiddleware = [
  'Adonis/Middleware/Cors',
  'Adonis/Middleware/BodyParser',
  'Adonis/Middleware/Shield',
  'Adonis/Middleware/Flash',
  'Adonis/Middleware/AuthInit',
  'App/Http/Middleware/AuthenticatedUserPopulate',
  // 'Adonis/Middleware/DetectLocale'
]

/*
|--------------------------------------------------------------------------
| Named Middleware
|--------------------------------------------------------------------------
|
| Named middleware are key/value pairs. Keys are later used on routes
| which binds middleware to specific routes.
|
*/
const namedMiddleware = {

  // APTS middlewares
  auth: 'App/Http/Middleware/Auth',
  judge: 'App/Http/Middleware/Authbasic',
  notauth: 'App/Http/Middleware/Notauth',
  admin: 'App/Http/Middleware/RouteForAdmin',
}

/*
|--------------------------------------------------------------------------
| Register Middleware
|--------------------------------------------------------------------------
|
| Here we finally register our defined middleware to Middleware provider.
|
*/
Middleware.global(globalMiddleware)
Middleware.named(namedMiddleware)
