'use strict'

/*
|--------------------------------------------------------------------------
| PageSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

const Factory = use('Factory')
const Page = use('App/Models/Page')

class PageSeeder {
  async run () {
    // Create random visible pages
    await Factory.model('App/Models/Page').createMany(5)

    // Create random invisible pages
    await Factory.model('App/Models/Page').createMany(5, {visible: false})

    let page = await Page.findBy('path', 'apts')
    if (page == null) {
      // Create home page
      await Factory.model('App/Models/Page').create({name: 'APTS', path: 'apts'})
    }
  }
}

module.exports = PageSeeder
