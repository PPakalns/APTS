const { hooks } = require('@adonisjs/ignitor')

const utility = require('../utility/utility.js')

hooks.after.providersBooted(() => {
  const View = use('View')
  let marked = require('marked');
  View.global('markdown', function (text) {
    return this.safe(marked(text, {sanitize: true}))
  })
  View.global('round', function(val, places) {
    return Number(val).toFixed(places)
  })

  View.global('testVisible', function(test, assignment) {
    return (test.visible || assignment.score_visibility >= 8)
  })
  View.global('testDetailed', function(test, assignment) {
    return (test.visible || assignment.score_visibility >= 12)
  })

  View.global('paginator', function (submissions, page_param, params) {
    let range = 3
    let pageDict = {1: true}
    for (let i = 1; i <= Math.min(1 + range, submissions.lastPage); i++) {
      pageDict[i] = true;
    }

    for (let i = Math.max(submissions.page - range, 1);
         i <= Math.min(submissions.page + range, submissions.lastPage);
         i++) {
      pageDict[i] = true;
    }

    for (let i = Math.max(submissions.lastPage - range, 1); i <= submissions.lastPage; i++) {
      pageDict[i] = true;
    }

    let pageIdxs = Object.keys(pageDict).map(Number).sort((a, b) => (a - b));

    let outpages = []
    let lidx = 0
    for (let idx of pageIdxs) {
      if (idx != lidx + 1) {
        outpages.push({link: false, text: "..."})
      }
      lidx = idx
      outpages.push({
        link: true,
        text: String(idx),
        active: (submissions.page == idx),
        params: Object.assign({}, params, {[page_param]: idx})
      })
    }
    return outpages
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
