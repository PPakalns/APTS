'use strict'

/*
|--------------------------------------------------------------------------
| Database Seeder
|--------------------------------------------------------------------------
| Database Seeder can be used to seed dummy data to your application
| database. Here you can make use of Factories to create records.
|
| make use of Ace to generate a new seed
|   ./ace make:seed [name]
|
*/

const Factory = use('Factory')

const User = use('App/Model/User')

class DatabaseSeeder {

  * run () {
    // Generating users and groups
    const users = yield Factory.model('App/Model/User').create(10)
    const groups = yield Factory.model('App/Model/Group').create(10)

    // Testing user
    const user = yield User.create({
      email: "test@test.lv",
      password: "testtest"
    });

    // Generating group_user relationships
    const usersIds = yield User.ids()

    groups.each(function * (group) {
      var uids = usersIds
      uids.sort( function() { return 0.5 - Math.random() } );
      uids = uids.slice( 0, 3 )
      yield group.users().attach(uids)
    })

  }

}

module.exports = DatabaseSeeder
