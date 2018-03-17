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
  async store ({ auth, request, response, session, antl }) {
    const { email, password } = request.all()

    try {
      await auth.attempt(email, password)
    } catch (e) {
      session.flashExcept(['password'])
      session.flash({ error: antl.formatMessage('main.missing_credentials') })
      return response.route('SessionController.create')
    }

    // User must be activated
    const user = await auth.getUser()
    if (!user.activated)
    {
      session.flashExcept(['password'])
      session.flash({ error: antl.formatMessage('main.user_not_activated') })
      await auth.logout()
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
