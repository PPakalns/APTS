'use strict'

const Schema = use('Schema')

class TestresultsTableSchema extends Schema {

  up () {
    this.create('testresults', (table) => {
      table.increments()
      table.timestamps()

      table.integer('submission_id').unsigned().references('id').inTable('submissions')
      table.integer('test_id').unsigned().references('id').inTable('tests')

      // Is test public
      table.boolean("visible").notNullable().defaultTo(false)

      table.string('status', 10)
      table.integer('memory')
      table.decimal('time', 6, 3)
      table.string('stderr', 5000)
      table.string('public', 1000)
      table.string('private', 1000)
      table.integer('score')
    })
  }

  down () {
    this.drop('testresults')
  }

}

module.exports = TestresultsTableSchema
