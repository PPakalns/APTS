'use strict'

class PopulateRole {
  async handle ({ request, auth }, next) {
    /**
     * Retrieve user roles and store them in request.roles
     */
    request.roles = {admin: false, auth: false}
    try {
      let user = await auth.getUser()

      request.roles.auth = true
      let roles = await user.roles().fetch()
      for (let role of roles.toJSON()) {
        if (role.role == 1) {
          request.roles.admin = true
        }
      }
    } catch (error) {
    }
    await next()
  }
}

module.exports = PopulateRole
