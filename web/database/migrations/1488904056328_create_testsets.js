'use strict'

const Schema = use('Schema')

class TestsetsTableSchema extends Schema {

  up () {
    this.create('testsets', (table) => {
      table.increments()
      table.timestamps()

      table.integer('problem_id').unsigned().references('id').inTable('problems')

      table.decimal('timelimit', 4, 2)
      table.integer('memory')

      // Test zip archive
      table.integer('test_count')
      table.integer('zip_id').unsigned().references('id').inTable('files')

      // Checker cpp file
      table.integer('checker_id').unsigned().references('id').inTable('files')
    })
  }

  down () {
    this.drop('testsets')
  }
}

module.exports = TestsetsTableSchema
