'use strict'

const Factory = use('Factory')
const { test, trait } = use('Test/Suite')('Sign up')
const User = use('App/Models/User')
const Mail = use('Mail')
const Hash = use('Hash')
const Recaptcha2 = use('Recaptcha2')

trait('Test/Browser')
trait('DatabaseTransactions')

test('can sign up and activate user through email', async ({ browser, assert }) => {
  Mail.fake()
  Recaptcha2.fake()

  // Given we are on the sign up page
  let page = await browser.visit('/signup')

  // When we fill and send the login form
  await page
    .type('[name="email"]', 'test@test.te')
    .type('[name="email_confirmation"]', 'test@test.te')
    .submitForm('form')
    .waitForNavigation()

  // We expect to be on the homepage
  await page.assertPath('/signin')

  // And we expect to see an alert message
  await page.assertExists('div.alert.alert-success')

  // And to have a user into the database which is not activated
  let user = await User.findBy('email', 'test@test.te')
  assert.isNotNull(user)
  assert.isNotOk(user.activated)
  assert.isNull(user.password)

  // Email must have been sent
  const recentEmail = Mail.pullRecent()
  assert.equal(recentEmail.envelope.to.length, 1)
  assert.equal(recentEmail.envelope.to[0], 'test@test.te')

  // Retrieve url from email
  let html = recentEmail.message.html
  let idx = html.indexOf("/signup/activate/")
  assert.notEqual(idx, -1)
  let idx2 = html.indexOf("\n", idx)
  assert.notEqual(idx2, -1)
  let url = html.substr(idx, idx2)

  // Opening activation link
  page = await browser.visit(url)

  // And providing password
  await page
    .type('[name="password"]', 'secret')
    .type('[name="password_confirmation"]', 'secret')
    .submitForm('form')
    .waitForNavigation()

  // We expect to be on sign in page
  await page.assertPath('/signin')

  // And we expect to see an successful alert message
  await page.assertExists('div.alert.alert-success')

  // And user should be activated
  user = await User.findBy('email', 'test@test.te')
  assert.isNotNull(user)
  assert.isOk(user.activated)
  assert.isNotNull(user.password)

  // And password should match the provided one
  // assert.equal(await Hash.make('secret'), user.password)

  Mail.restore()
  Recaptcha2.restore()
}).timeout(4000)

