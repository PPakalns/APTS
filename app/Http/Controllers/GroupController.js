'use strict'

const Group = use('App/Model/Group')

class GroupController {

  * index(req, res) {
    const groups = yield Group.all();

    yield res.sendView('group/list', {groups: groups.toJSON()})
  }

  * show(req, res) {
    const id = req.param('id')
    const group = yield Group.findOrFail(id)

    yield res.sendView('group/show', {group: group.toJSON()})
  }

  * edit(req, res) {
    const id = req.param('id')
    const group = yield Group.findOrFail(id)

    yield res.sendView('group/edit', {group: group.toJSON()})
  }

  * edit_save(req, res) {
    const id = req.param('id')
    yield req.withAll().flash()
    res.route('group/edit',{id: id})
  }
}

module.exports = GroupController
