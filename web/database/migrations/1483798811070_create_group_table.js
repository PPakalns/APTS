'use strict'

const Schema = use('Schema')

class GroupsTableSchema extends Schema {

  up () {
    this.create('groups', (table) => {
      table.increments()
      table.timestamps()
      table.string('name', 525)
      table.text('description')
      table.boolean('public').notNullable().defaultTo(false)
    })
  }

  down () {
    this.drop('groups')
  }

}

module.exports = GroupsTableSchema
