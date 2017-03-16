'use strict'

const Schema = use('Schema')

class UsersTableSchema extends Schema {

    up () {
        this.table('users', (table) => {
            table.string('token', 24).notNullable().unique().defaultTo("")
            table.string('student_id')  // unique student identificator

            table.boolean('activated').notNullable().defaultTo(false)

            // Email change message
            table.string('email_change_new')
            table.string('email_change_hash', 60)
            table.string('email_change_time')  // 20 minute delay between attempts

            // Variables for password change
            table.string('password_reset_hash', 60)
            table.datetime('password_reset_time')
        })
    }

    down () {
        this.table('users', (table) => {
            table.dropColumn('token')
            table.dropColumn('student_id')

            table.dropColumn('activated')

            // Email change message
            table.dropColumn('email_change_new')
            table.dropColumn('email_change_hash')
            table.dropColumn('email_change_time')

            // Variables for password change
            table.dropColumn('password_reset_hash')
            table.dropColumn('password_reset_time')
        })
    }

}

module.exports = UsersTableSchema
