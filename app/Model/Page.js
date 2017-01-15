'use strict'

const Lucid = use('Lucid')

class Page extends Lucid {
  static rules (pageId) {
    return {
      name: 'required|max:524',
      intro: 'max:524',
      //description: '',
      path: `required|alpha_numeric|min:1|max:524|unique:pages,path,id,${pageId}`
    }
  }

  static scopeVisible (builder) {
    builder.where('visible', 1)
  }
}

module.exports = Page
