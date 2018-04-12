'use strict'

class Admin {
  async handle ({ request, session, antl, response }, next) {
    /**
     * To access routes with this middleware
     * User needs role of the admin
     */
    if (request.roles.admin == false) {
      session
        .flash({error: antl.formatMessage('main.no_permissions') })
      return response.redirect('/')
    }
    await next()
  }
}

module.exports = Admin
