'use strict'

const Schema = use('Schema')

class RolesTableSchema extends Schema {

  up () {
    this.create('roles', (table) => {
      table.increments()

      table.integer('user_id').unsigned().references('id').inTable('users')
      table.integer('role')

      // Role description
      // role = 1 - Page administrator

      table.timestamps()
    })
  }

  down () {
    this.drop('roles')
  }

}

module.exports = RolesTableSchema
