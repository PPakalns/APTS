'use strict'

const { test, trait } = use('Test/Suite')('Groups')

const Factory = use('Factory')
const Group = use('App/Models/Group')

trait('Auth/Client')
trait('Test/Browser')
trait('Session/Client')
trait('DatabaseTransactions')

function groupShowUrl(group) {
  return `/group/show/${group.id}`;
}

test('Unauthorized user can view public groups', async ({ assert, browser }) => {

  // Given we have a public group
  const group = await Factory.model('App/Models/Group').create({public: true})

  // When we visit groups page
  const page = await browser.visit(groupShowUrl(group))

  // We expect to see the title of group
  await page.assertHas(group.name)

  // And still be on the same page
  assert.include(await page.getPath(), groupShowUrl(group))
})

test('Unauthorized user can not view private groups', async ({ assert, browser }) => {

  // Given we have a private group
  const group = await Factory.model('App/Models/Group').create({public: false})

  // When we visit groups page
  const page = await browser.visit(groupShowUrl(group))

  // we expect to be redirected away
  assert.notInclude(await page.getPath(), groupShowUrl(group))

  // We expect to see a error message
  await page.assertExists('div.alert.alert-danger')
})

test('Authorized user can view private groups he participates in', async ({ assert, browser }) => {
  // Given we have a user
  const user = await Factory.model('App/Models/User').create()

  // Given we have a private group
  const group = await Factory.model('App/Models/Group').create({public: false})

  // And user is participant in this group
  await user.groups().attach([group.id])

  // When we visit groups page
  const page = await browser.visit(groupShowUrl(group), (request) => {
    request.loginVia(user)
  })

  // We expect to see the title of group
  await page.assertHas(group.name)
})

test('Authorized user can not view private groups in which he does not participate in', async ({ assert, browser }) => {
  // Given we have a user
  const user = await Factory.model('App/Models/User').create()

  // Given we have a private group in which user doesn't participate
  const group = await Factory.model('App/Models/Group').create({public: false})

  // When we visit groups page
  const page = await browser.visit(groupShowUrl(group), (request) => {
    request.loginVia(user)
  })

  // we expect to be redirected away
  assert.notInclude(await page.getPath(), groupShowUrl(group))

  // We expect to see a error message
  await page.assertExists('div.alert.alert-danger')
})
