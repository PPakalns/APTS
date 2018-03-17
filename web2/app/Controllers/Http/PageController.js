'use strict'

const Page = use('App/Models/Page')

class PageController {

  async index ({ view }) {
    const pages = await Page.all()
    return view.render('pages.index', { pages: pages.toJSON() })
  }

  async show ({ view, params, request, session, antl, response }) {
    const page = await Page.findByOrFail("path", params.path)

    // Hidden pages are visible only by admin
    if (page.visible == false && request.roles.admin == false) {
      session
        .flash({ success: antl.formatMessage('main.no_permissions') })
      return response.redirect('back')
    }

    return view.render('pages.show', { page: page.toJSON() })
  }

  create ({ view }) {
    return view.render('pages.create')
  }

  async store ({ session, request, response }) {
    const data = request.only(['name', 'intro', 'comment', 'description',
                               'path', 'visible'])
    await Page.create(data)
    return response.route('PageController.show', {path: data.path})
  }

  async edit ({ params, view }) {
    const page = await Page.findOrFail(params.id)
    return view.render('pages.edit', { page: page.toJSON() })
  }

  async update ({ params, session, request, response }) {
    const data = request.only(['name', 'intro', 'comment', 'description',
                               'path', 'visible'])
    const page = await Page.findOrFail(params.id)
    page.merge(data)
    await page.save()

    return response.route('PageController.show', {path: page.path})
  }

  async delete ({ params, response }) {
    const page = await Page.findOrFail(params.id)
    await page.delete()

    return response.route('PageController.index')
  }
}

module.exports = PageController
