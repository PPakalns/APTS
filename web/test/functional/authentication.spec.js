'use strict'

const Factory = use('Factory')
const { test, trait } = use('Test/Suite')('Authentication')
const antl = use('Antl')

trait('Test/Browser')
trait('DatabaseTransactions')

test('should display an error when crendentials are incorrect', async ({ browser }) => {
  // Given we have no user

  // And we are on the sign in page
  const page = await browser.visit('/signin')

  // When we fill and send the sign in form
  await page
    .type('[name="email"]', 'romain.lanz')
    .type('[name="password"]', 'secret')
    .submitForm('form')
    .waitForNavigation()

  // We expect to be again on the sign in page
  await page.assertPath('/signin')

  // And we expect to see an alert message
  await page.assertExists('div.alert.alert-danger')

  // And to see the username filled
  await page.assertValue('[name="email"]', 'romain.lanz')
}).timeout(0)

test('a user can log in inside the application', async ({ browser }) => {
  // Given we have a user
  const user = await Factory.model('App/Models/User').create({ password: 'secret' })

  // And we are on the sign in page
  const page = await browser.visit('/signin')

  // When we fill and send the sign in form
  await page
    .type('[name="email"]', user.email)
    .type('[name="password"]', 'secret')
    .submitForm('form')
    .waitForNavigation()

  // We expect to be on the homepage
  await page.assertHas(antl.formatMessage('main.signout'))
}).timeout(0)

test('a not activated user can not log in inside the application', async ({ browser }) => {
  // Given we have a non activated user
  const user = await Factory.model('App/Models/User').create({ password: 'secret', activated: false })

  // And we are on the sign in page
  const page = await browser.visit('/signin')

  // When we fill and send the sign in form
  await page
    .type('[name="email"]', user.email)
    .type('[name="password"]', 'secret')
    .submitForm('form')
    .waitForNavigation()

  // We expect to be on the sign in page
  await page.assertPath('/signin')

  // And we expect to see an alert message
  await page.assertExists('div.alert.alert-danger')
}).timeout(0)
