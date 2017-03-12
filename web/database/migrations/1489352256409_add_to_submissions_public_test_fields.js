'use strict'

const Schema = use('Schema')

class SubmissionsTableSchema extends Schema {

  up () {
    this.table('submissions', (table) => {
        table.integer('public_score')
        table.integer('public_maxscore')
        table.decimal('public_maxtime', 5, 2)
        table.integer('public_maxmemory')
    })
    this.table('assignments', (table) => {
        table.boolean('all_tests_visible').notNullable().defaultTo(false)
    })
  }

  down () {
    this.table('submissions', (table) => {
        table.dropColumn('public_score')
        table.dropColumn('public_maxscore')
        table.dropColumn('public_maxtime')
        table.dropColumn('public_maxmemory')
    })
    this.table('assignments', (table) => {
        table.dropColumn('all_tests_visible')
    })
  }

}

module.exports = SubmissionsTableSchema
