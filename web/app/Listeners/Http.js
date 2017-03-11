'use strict'

const Env = use('Env')
const Ouch = use('youch')
const Http = exports = module.exports = {}

/**
 * handle errors occured during a Http request.
 *
 * @param  {Object} error
 * @param  {Object} request
 * @param  {Object} response
 */
Http.handleError = function * (error, request, response) {
  /**
   * DEVELOPMENT REPORTER
   */
  if (Env.get('NODE_ENV') === 'development') {
    const type = request.accepts('html', 'json')
    if (type == 'json')
    {
        return response.status(error.status || 500).json({status: "error", error: error.status || 500, full_error: error})
    }
    const ouch = new Ouch().pushHandler(
      new Ouch.handlers.PrettyPageHandler('blue', null, 'sublime')
    )
    ouch.handleException(error, request.request, response.response, (output) => {
      console.error(error.stack)
    })
    return
  }

  /**
   * PRODUCTION REPORTER
   */
  const type = request.accepts('html', 'json')
  const status = error.status || 500
  console.error(error.stack)
  if (type == 'json')
  {
    return response.status(status).json({status: "error", error: error.status || 500})
  }
  yield response.status(status).sendView('errors/index', {error})
}

/**
 * listener for Http.start event, emitted after
 * starting http server.
 */
Http.onStart = function () {
  const View = use('Adonis/Src/View')

  const marked = require('marked');
  marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false
  });

  View.filter('markdown', function (str) {
    if (str===undefined)
      return "";
    return marked(str)
  })
}
