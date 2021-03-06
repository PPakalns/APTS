'use strict'

const Schema = use('Schema')

class ProblemsTableSchema extends Schema {

  up () {
    this.create('problems', (table) => {
      table.increments()
      table.timestamps()
      table.string('name', 525)
      table.text('description')
      table.integer('author').unsigned().references('id').inTable('users')

      // table.integer('testset_id').unsigned().references('id').inTable('testsets') - defined after testsets
    })
  }

  down () {
    this.drop('problems')
  }

}

module.exports = ProblemsTableSchema
