'use strict'

const Schema = use('Schema')

class PagesTableSchema extends Schema {

  up () {
    this.create('pages', (table) => {
      table.increments()
      table.timestamps()
      table.string('name', 525)
      table.string('intro', 525)
      table.string('comment', 525)
      table.text('description')

      table.boolean('visible')

      table.string('path')
    })
  }

  down () {
    this.drop('pages')
  }

}

module.exports = PagesTableSchema
