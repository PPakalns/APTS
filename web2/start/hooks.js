const { hooks } = require('@adonisjs/ignitor')

const utility = require('../utility/utility.js')

hooks.after.providersBooted(() => {
  const View = use('View')
  let marked = require('marked');
  View.global('markdown', function (text) {
    return this.safe(marked(text, {sanitize: true}))
  })
})

hooks.after.providersBooted(() => {
  const Validator = use('Validator')
  const Antl = use('Antl')

  const prangeFn = async (data, field, message, args, get) => {
    const value = get(data, field)
    if (!value) {
      // required rule
      return
    }

    try {
      utility.getRangeSet(value)
    } catch (err) {
      throw err.message
    }
  }

  Validator.extend('prange', prangeFn)

  Validator.sanitizor.toFloat = function(value) {
    return parseFloat(value)
  }

  Validator.sanitizor.toPrange = function(value) {
    try {
      return utility.parseRangeStr(value)
    } catch (err) {
      return value;
    }
  }
})
