'use strict'

const User = use('App/Models/User')
const Event = use('Event')
const Hash = use('Hash')

const Token = require('rand-token').generate;
const LEN_KEY = 48

const WAIT_TIME = 30 * 60 * 1000
const VALID_TIME = 120 * 60 * 1000

class UserController {

  /**
   * Display user sign up page
   */
  async create ({ view }) {
    return view.render('user.create')
  }

  /**
   * Sign up user and send registration email
   */
  async store ({ request, response, session, antl }) {
    let data = request.only(['email', 'email_confirmation'])

    let user = new User()
    user.email = data.email
    user.activated = false
    user.email_change_hash = String(Token(LEN_KEY))
    user.email_change_time = new Date()
    await user.save()

    // Fire event for registration email etc
    Event.fire('new:user', user)

    session
      .flash({ success: antl.formatMessage('main.successful_signup') })
    return response.redirect('/signup')
  }

  /**
   * Show user activation page, in this page user must set his password
   */
  async activate ({ view, request, params }) {
    const data = { token: params.token, key: params.key }
    return view.render('user.password', data)
  }

  /**
   * Activate user by setting its password and redirecting to sign in page
   */
  async storeActivate ({ view, request, response, antl, session }) {
    const data = request.only(['token', 'key', 'password', 'password_confirmation'])

    const user = await User.findBy('token', data.token)

    if (user === null || user.activated || user.email_change_hash != data.key) {
      session
        .flash({error: antl.formatMessage('main.bad_activation_url') })
      return response.redirect('back')
    }

    user.password = await Hash.make(data.password)
    user.activated = true
    await user.save()

    session
      .flash({ success: antl.formatMessage('main.successful_user_activation') })
    return response.redirect('/signin')
  }
}

module.exports = UserController
