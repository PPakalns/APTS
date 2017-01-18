'use strict'

const Lucid = use('Lucid')

class Page extends Lucid {
  static rules (pageId) {
    return {
      name: 'required|string|max:524',
      intro: 'string|max:524',
      description: 'string',
      path: `required|alpha_numeric|min:1|max:524|unique:pages,path,id,${pageId}`,
      comment: 'string|max:524'
    }
  }

  static scopeVisible (builder) {
    builder.where('visible', 1)
  }
}

module.exports = Page
