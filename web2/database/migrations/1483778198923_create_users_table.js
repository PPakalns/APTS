'use strict'

const Schema = use('Schema')

class UsersTableSchema extends Schema {

    up () {
        this.create('users', table => {
            table.increments()
            table.timestamps()

            table.string('email', 254).notNullable().unique()
            table.string('password', 60).nullable()
            table.integer('failed_login').unsigned().notNullable().defaultTo(0)

            table.string('token', 24).notNullable().unique().defaultTo("")
            table.string('student_id')  // unique student identificator

            table.integer('created_by_id').unsigned().references('id').inTable('users')

            table.boolean('activated').notNullable().defaultTo(false)

            // Email change message
            table.string('email_change_hash', 60)
            table.string('email_change_time')  // 20 minute delay between attempts

            // Variables for password change
            table.string('password_reset_hash', 60)
            table.datetime('password_reset_time')
        })
    }

    down () {
        this.drop('users')
    }

}

module.exports = UsersTableSchema
