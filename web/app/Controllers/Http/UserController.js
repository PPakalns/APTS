'use strict'

const User = use('App/Models/User')
const Event = use('Event')
const Hash = use('Hash')
const Recaptcha = use('Recaptcha2')
const { sanitizor } = use('Validator')

const WAIT_TIME = 30 * 60 * 1000;
const VALID_TIME = 120 * 60 * 1000;

class UserController {

  async show ({ view, params, request, auth, session, antl, response }) {
    let thisUser = await auth.getUser()
    let requestedUserId = params.id || thisUser.id

    if (!request.roles.admin && thisUser.id != requestedUserId) {
      session
        .flash({error: antl.formatMessage('main.no_permissions') })
      return response.redirect('back')
    }

    let user = await User.findOrFail(requestedUserId)
    await user.load('groups')

    let submissions = null

    if (request.roles.admin) {
      let page = sanitizor.toInt(params.page, 10)
      page = isNaN(page) ? 1 : Math.max(page, 1)
      submissions = await user
        .submissions()
        .with('assignment.group')
        .with('assignment.problem')
        .with('user')
        .orderBy('id', 'desc')
        .paginate(page, 20)
      submissions = submissions.toJSON()
    }

    return view.render('user.show', {
        submissions: submissions,
        user: user.toJSON(),
      }
    )
  }

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
    let data = request.only(['email'])

    try {
      await Recaptcha.validate(request.input('g-recaptcha-response'))
    } catch (errorCodes) {
      session
        .withErrors([{ field: 'recaptcha', message: antl.formatMessage('main.alert_recaptcha')}])
        .flashAll()
      return response.route('UserController.create')
    }

    await User.newUser(sanitizor.normalizeEmail(data.email))

    session
      .flash({ success: antl.formatMessage('main.successful_signup') })
    return response.redirect('/signin')
  }

  /**
   * Show user activation page, in this page user must set his password
   */
  async activate ({ view, request, params, antl }) {
    return view.render('user.password', {
      token: params.token,
      key: params.key,
      action: 'UserController.storeActivate',
      header_msg: antl.formatMessage('main.signup'),
      button_msg: antl.formatMessage('main.signup'),
    })
  }

  /**
   * Activate user by setting its password and redirecting to sign in page
   */
  async storeActivate ({ view, request, response, antl, session }) {
    const data = request.only(['token', 'key', 'password'])

    const user = await User.findBy('token', data.token)

    if (user === null || user.activated || !(await User.validateHash(data.key, user.email_change_hash))) {
      session.flash({error: antl.formatMessage('main.bad_activation_url') })
      return response.redirect('back')
    }

    user.password = await Hash.make(data.password)
    user.activated = true
    await user.save()

    session
      .flash({ success: antl.formatMessage('main.successful_user_activation') })
    return response.redirect('/signin')
  }

  /**
   * Show resend activation form
   */
  async requireResendActivation({ view, antl }) {
    return view.render('user.request_email', {
      action: "UserController.resendActivation",
      header: antl.formatMessage("main.send_activation_email_again"),
      lead: antl.formatMessage("main.send_activation_email_again_desc"),
    })
  }

  /**
   * Resend activation email
   */
  async resendActivation({ request, response, session, antl }) {
    let data = request.only(['email'])

    try {
      await Recaptcha.validate(request.input('g-recaptcha-response'))
    } catch (errorCodes) {
      session
        .withErrors([{ field: 'recaptcha', message: antl.formatMessage('main.alert_recaptcha')}])
        .flashAll()
      return response.route('UserController.requireResendActivation')
    }

    let user = await User.findBy('email', sanitizor.normalizeEmail(data.email))
    if (!user || user.activated) {
      session.flash({ error: antl.formatMessage('main.user_already_activated') })
      return response.redirect('back')
    }

    if (user.email_change_time) {
      let diff = (new Date()) - Date.parse(user.email_change_time)
      if (diff < WAIT_TIME) {
        let min = Math.ceil((WAIT_TIME - diff)/60000.0)
        session.flash({ error: antl.formatMessage('main.email_rate_limit', { remaining: min }) })
        return response.redirect('back')
      }
    }

    let key = User.getToken()
    user.email_change_time = new Date()
    user.email_change_hash = await User.Hash(key)
    await user.save()

    Event.fire('mail:registration', {user, key})

    session.flash({ success: antl.formatMessage('main.email_sent') })
    return response.redirect('/')
  }

  /**
   * Password reset form
   */
  async requireResetPassword({ view, antl }) {
    return view.render('user.request_email', {
      action: "UserController.sendResetPassword",
      header: antl.formatMessage("main.send_forgot_password_email"),
      lead: antl.formatMessage("main.send_forgot_password_email_desc"),
    })
  }

  /**
   * Sends password reset email to user
   */
  async sendResetPassword({ request, antl, session, response }) {
    let data = request.only(['email'])

    try {
      await Recaptcha.validate(request.input('g-recaptcha-response'))
    } catch (errorCodes) {
      session
        .withErrors([{ field: 'recaptcha', message: antl.formatMessage('main.alert_recaptcha')}])
        .flashAll()
      return response.route('UserController.requireResetPassword')
    }

    let user = await User.findBy('email', sanitizor.normalizeEmail(data.email))
    if (!user || !user.activated) {
      session.flash({ error: antl.formatMessage('main.user_not_activated_not_registered') })
      return response.redirect('back')
    }

    if (user.password_reset_time) {
      let diff = (new Date()) - Date.parse(user.password_reset_time)
      if (diff < WAIT_TIME) {
        let min = Math.ceil((WAIT_TIME - diff)/60000.0)
        session.flash({ error: antl.formatMessage('main.email_rate_limit', { remaining: min }) })
        return response.redirect('back')
      }
    }

    let key = User.getToken()
    user.password_reset_time = new Date()
    user.password_reset_hash = await User.Hash(key)
    await user.save()

    Event.fire('mail:reset_password', {user, key})

    session.flash({ success: antl.formatMessage('main.email_sent') })
    return response.redirect('/')
  }

  /**
   * Password change view after opening url sent in email
   */
  async resetPassword({ view, params, antl }) {
    return view.render('user.password', {
      token: params.token,
      key: params.key,
      action: 'UserController.storeResetPassword',
      header_msg: antl.formatMessage('main.change_password'),
      button_msg: antl.formatMessage('main.change_password'),
    })
  }

  /**
   * Change user password after opening url and submitting form
   */
  async storeResetPassword({ request, antl, session, response }) {
    const data = request.only(['token', 'key', 'password'])

    const user = await User.findBy('token', data.token)

    if (user === null || !user.activated || !(await User.validateHash(data.key, user.password_reset_hash))) {
      session.flash({error: antl.formatMessage('main.bad_activation_url') })
      return response.redirect('back')
    }

    let diff = (new Date()) - Date.parse(user.password_reset_time);
    if (diff > VALID_TIME)
    {
      session.flash({error: antl.formatMessage('main.outdated_link') })
      return response.redirect('back')
    }

    user.password = await Hash.make(data.password)
    user.password_reset_hash = null
    // Password reset time is not set to null, so that user can not spam password reset multiple times
    await user.save()

    session
      .flash({ success: antl.formatMessage('main.successfull_password_change') })
    return response.redirect('/signin')
  }

  async changePassword({ request, session, response, auth, antl }) {
    const data = request.only(['old_password', 'password'])
    let user = await auth.getUser()

    let passwordValidated = await Hash.verify(data.old_password, user.password)

    if (!passwordValidated) {
      session
        .withErrors([{ field: "old_password", message: antl.formatMessage('main.wrong_current_password')}])
        .flash({})
      return response.redirect('back')
    }

    user.password = await Hash.make(data.password)
    await user.save()

    session
      .flash({ success: antl.formatMessage('main.successfull_password_change') })
    return response.redirect('back')
  }
}

module.exports = UserController
