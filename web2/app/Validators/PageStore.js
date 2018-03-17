'use strict'

class PageStore {
  get rules () {
    const pageId = parseInt(this.ctx.params.id)
    return {
      name: 'required|string|max:524',
      intro: 'string|max:524',
      description: 'string',
      path: `required|alpha_numeric|min:1|max:524|unique:pages,path,id,${pageId}`,
      comment: 'string|max:524'
    }
  }
}

module.exports = PageStore
