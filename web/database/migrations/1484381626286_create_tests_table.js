'use strict'

const Schema = use('Schema')

class TestsTableSchema extends Schema {

  up () {
    this.create('tests', (table) => {
      table.increments()
      table.timestamps()

      table.integer('tid') // Test number
      table.string('gid', 10) // Test identificator in group ("", a, b, c)

      table.integer('testset_id').unsigned().references('id').inTable('testsets')

      table.string('input_file', 255)
      table.string('output_file', 255)
    })
  }

  down () {
    this.drop('tests')
  }

}

module.exports = TestsTableSchema
