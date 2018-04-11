'use strict'

const User = use('App/Models/User')
const Recaptcha = use('Recaptcha2')

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
    const MAX_FAILED_LOGINS = 5
    let showRecaptcha = false

    let tmpUser = await User.findBy('email', email)

    if (tmpUser) {
      // Validate recaptcha
      if (tmpUser.failed_login > MAX_FAILED_LOGINS) {
        showRecaptcha = true;
        const captcha_key = request.input('g-recaptcha-response')

        try {
          await Recaptcha.validate(captcha_key)
        } catch (errorCodes) {
          session
            .flashExcept(['password'])
            .withErrors([{ field: 'recaptcha', message: antl.formatMessage('main.alert_recaptcha')}])
            .flash({showRecaptcha: true})
          return response.route('SessionController.create')
        }
      }
    }

    try {
      await auth.attempt(email, password)
    } catch (e) {
      if (tmpUser) {
        tmpUser.failed_login += 1
        await tmpUser.save()
        if (tmpUser.failed_login > MAX_FAILED_LOGINS) {
          showRecaptcha = true;
        }
      }
      session
        .flashExcept(['password'])
        .flash({ showRecaptcha, error: antl.formatMessage('main.missing_credentials') })
      return response.route('SessionController.create')
    }

    // User must be activated
    const user = await auth.getUser()
    if (!user.activated)
    {
      session
        .flashExcept(['password'])
        .flash({ showRecaptcha, error: antl.formatMessage('main.user_not_activated') })
      await auth.logout()
      return response.route('SessionController.create')
    }

    user.failed_login = 0
    await user.save()
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
