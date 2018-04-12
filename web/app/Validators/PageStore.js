'use strict'

const Antl = use('Antl')

class PageStore {
  get messages() {
    return {
      'required': Antl.formatMessage('main.val_required'),
      'string': Antl.formatMessage('main.val_string'),
      'max': Antl.formatMessage('main.val_max'),
      'alpha_numeric': Antl.formatMessage('main.val_alpha_numeric'),
      'min': Antl.formatMessage('main.val_min'),
      'unique': Antl.formatMessage('main.val_unique'),
    }
  }

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
