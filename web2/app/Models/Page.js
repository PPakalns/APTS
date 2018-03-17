'use strict'

const Model = use('Model')

class Page extends Model {
  static scopeVisible (query) {
    return query.where('visible', true)
  }
}

module.exports = Page
