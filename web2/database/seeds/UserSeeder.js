'use strict'

const Factory = use('Factory')
const Role = use('App/Models/Role')

class UserSeeder {
  async run () {
    const user = await Factory
      .model('App/Models/User')
      .create({email: 'user@user.us', password: 'user'})
    const admin = await Factory
      .model('App/Models/User')
      .create({email: 'admin@admin.us', password: 'admin'})
    const adminRole = await admin.roles().create({role: 1})
  }
}

module.exports = UserSeeder
