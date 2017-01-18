'use strict'

const Schema = use('Schema')

class AssignmentsTableSchema extends Schema {

  up () {
    this.create('assignments', (table) => {
      table.increments()
      table.timestamps()

      table.boolean('visible')
      table.integer('problem_id').unsigned().references('id').inTable('problems')
      table.integer('group_id').unsigned().references('id').inTable('groups')
    })
  }

  down () {
    this.drop('assignments')
  }

}

module.exports = AssignmentsTableSchema
