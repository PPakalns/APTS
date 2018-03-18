'use strict'

const { test, trait } = use('Test/Suite')('Page')
const Factory = use('Factory')
const Page = use('App/Models/Page')

trait('Auth/Client')
trait('Test/Browser')
trait('Session/Client')
trait('DatabaseTransactions')

test('Non priviliged user can not write post', async ({ assert, browser }) => {
  // Given we have a user without admin permissions
  const user = await Factory.model('App/Models/User').create()

  // And we are logged on the page creation page
  const page = await browser.visit('/page/create', (request) => {
    request.loginVia(user)
  })

  // We expect to see an alert message
  await page.assertExists('div.alert.alert-danger')

  // And be redirected elsewere
  assert.notInclude(await page.getPath(), '/page/create')
})

test('Priviliged user can write a post', async ({ assert, browser }) => {
  // Given we have a user with admin permissions
  const user = await Factory.model('App/Models/User').create()
  await user.roles().create({role: 1})

  // And a generated page
  const page = await Factory.model('App/Models/Page').make({visible: false})

  // And we are logged on the page creation page
  const bPage = await browser.visit('/page/create', (request) => {
    request.loginVia(user)
  })

  // Where visible checkbox should be enabled by default
  await bPage.assertIsChecked('[name="visible"]')

  // When we fill and send the form
  await bPage
    .type('[name="name"]', page.name)
    .type('[name="intro"]', page.intro)
    .type('[name="comment"]', page.comment)
    .type('[name="path"]', page.path)
    .type('[name="description"]', page.description)

  if (page.visible == false)
    await bPage.uncheck('[name="visible"]')

  await bPage
    .submitForm('form')
    .waitForNavigation()

  // We expect to see the name of created page
  await bPage.assertHas(page.name)

  // We must see the path of created page in the url
  assert.include(await bPage.getPath(), page.path)

  // We expect for it to be stored in the database
  let storedPage = await Page.findBy("name", page.name)
  assert.isNotNull(storedPage)
  assert.equal(!!storedPage.visible, page.visible)
}).timeout(4000)
