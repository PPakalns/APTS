'use strict'

const Schema = use('Schema')

class UserGroupTableSchema extends Schema {

  up () {
    this.create('user_group', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.integer('group_id').unsigned().references('id').inTable('groups')
    })
  }

  down () {
    this.drop('user_group')
  }

}

module.exports = UserGroupTableSchema
