'use strict'

const BaseExceptionHandler = use('BaseExceptionHandler')

/**
 * This class handles all exceptions thrown during
 * the HTTP request lifecycle.
 *
 * @class ExceptionHandler
 */
class ExceptionHandler extends BaseExceptionHandler {
  /**
   * Handle exception thrown during the HTTP lifecycle
   *
   * @method handle
   *
   * @param  {Object} error
   * @param  {Object} options.request
   * @param  {Object} options.response
   *
   * @return {void}
   */
  async handle (error, { request, response, session, view }) {
    if (error.name === 'ValidationException') {
      session.withErrors(error.messages).flashAll()
      await session.commit()
      return response.redirect('back')
    }
    if (error.name === 'HttpException') {
      if (error.status === 404) {
        return response.redirect('404')
      }
    }

    response.status(error.status).send("Please try again")
  }

  /**
   * Report exception for logging or debugging.
   *
   * @method report
   *
   * @param  {Object} error
   * @param  {Object} options.request
   *
   * @return {void}
   */
  async report (error, { request }) {
    if (error.name === 'ValidationException' ||
        (error.name === 'HttpException' && error.status === 404)) {
      return
    }
    console.error(error)
  }
}

module.exports = ExceptionHandler
