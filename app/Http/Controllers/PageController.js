'use strict'

const Page = use('App/Model/Page')
const Validator = use('Validator')

class PageController {

  * index(req, res) {
    const pages = yield Page.all()
    yield res.sendView('page/index', {pages: pages.toJSON()})
  }

  * create(req, res) {
    yield res.sendView('page/edit', {create:true})
  }

  * store(req, res) {
    const pageData = req.only('name', 'intro', 'comment', 'path', 'description', 'visible')

    const validation = yield Validator.validate(pageData, Page.rules(0))
    if (validation.fails())
    {
      yield req
        .withAll()
        .andWith({"errors": validation.messages()})
        .flash()
      res.redirect('back')
      return
    }

    console.log(pageData)

    const page = new Page()
    page.name = pageData.name;
    page.intro = pageData.intro;
    page.comment = pageData.comment;
    page.path = pageData.path;
    page.description = pageData.description;
    page.visible = !(!pageData.visible);
    yield page.save()

    yield req
        .with({"successes": [{message:"Lapa veiksmīgi izveidota!"}]})
        .flash()

    res.route('page.show', {id: page.path})
  }

  * show(req, res) {
    // id is page.path
    const path = req.param('id')
    let page;

    if (req.cUser.admin)
    {
      page = yield Page.query().where('path', path).first()
    }
    else
    {
      page = yield Page.query().visible().where('path', path).first()
    }

    yield res.sendView('page/show', {page: (page ? page.toJSON() : page)})
  }

  * edit(req, res) {
    const id = req.param('id')
    const page = yield Page.findOrFail(id)
    console.log(page.toJSON())

    yield res.sendView('page/edit', {page: page.toJSON()})
  }

  * update(req, res) {
    const pageData = req.only('id', 'name', 'intro', 'comment', 'path', 'description', 'visible')
    const page = yield Page.findOrFail(pageData.id)

    const validation = yield Validator.validate(pageData, Page.rules(page.id))
    if (validation.fails())
    {
      yield req
        .withAll()
        .andWith({"errors": validation.messages()})
        .flash()
      res.redirect('back')
      return
    }

    page.name = pageData.name;
    page.intro = pageData.intro;
    page.path = pageData.path;
    page.description = pageData.description;
    page.comment = pageData.comment;
    page.visible = !(!pageData.visible);
    yield page.save()

    yield req
        .with({"successes": [{message:"Lapa veiksmīgi rediģēta!"}]})
        .flash()

    res.route('page.show', {id: page.path})
  }

  * destroy(req, res) {
    res.send("OK")
  }
}

module.exports = PageController