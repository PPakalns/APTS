'use strict'

/*
|--------------------------------------------------------------------------
| Factory
|--------------------------------------------------------------------------
|
| Factories are used to define blueprints for database tables or Lucid
| models. Later you can use these blueprints to seed your database
| with dummy data.
|
*/

const Factory = use('Factory')

Factory.blueprint('App/Models/User', (faker, index, data) => {
  const defaultValue = {
    email: faker.email(),
    password: faker.password(),
    activated: true,
  }

  return Object.assign(defaultValue, data)
})

Factory.blueprint('App/Models/Role', (faker, index, data) => {
  const value = {
    user_id: data.user.id,
    role: data['admin'] ? 1 : 0,
  }
  return defaultValue;
})

Factory.blueprint('App/Models/Page', (faker, index, data) => {
  const defaultValue = {
    name: faker.sentence(),
    intro: faker.sentence(),
    comment: faker.sentence(),
    description: faker.paragraph(),
    visible: true,
    path: faker.word(),
  }

  return Object.assign(defaultValue, data)
})
