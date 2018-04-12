'use strict'

/*
|--------------------------------------------------------------------------
| GroupSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

const Factory = use('Factory')

class GroupSeeder {
  async run () {
    await Factory.model('App/Models/Group').createMany(10)
  }
}

module.exports = GroupSeeder
