'use strict'

class SessionController {

  /**
   * Display user sign in page
   */
  async create ({ view }) {
    return view.render('session.create')
  }

  /**
   * Authorize user and store a session
   */
  async store ({ auth, request, response, session }) {
    const { email, password } = request.all()

    try {
      await auth.attempt(email, password)
    } catch (e) {
      session.flashExcept(['password'])
      session.flash({ error: 'We cannot find any account with these credentials.' })
      return response.route('SessionController.create')
    }
    return response.redirect('/')
  }

  /**
   * Logout the user
   */
  async delete ({ auth, response }) {
    await auth.logout()
    return response.redirect('/')
  }
}

module.exports = SessionController
