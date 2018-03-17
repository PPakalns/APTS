const { hooks } = require('@adonisjs/ignitor')

hooks.after.providersBooted(() => {
  const View = use('View')
  let marked = require('marked');
  View.global('markdown', function (text) {
    return this.safe(marked(text, {sanitize: true}))
  })
})
