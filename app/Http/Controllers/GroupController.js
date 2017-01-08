'use strict'

const Group = use('App/Model/Group')
const Validator = use('Validator')

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
    const groupData = req.all('id', 'name', 'description')

    const validation = yield Validator.validate(groupData, Group.rules)
    if (validation.fails())
    {
      yield req
        .withAll()
        .andWith({"errors": [{message:"Lūdzu norādiet grupas nosaukumu."}]})
        .flash()
      res.route('group/edit',{id: id})
      return
    }

    const group = yield Group.findOrFail(groupData.id)
    group.name = groupData.name;
    group.description = groupData.description;
    yield group.save()

    yield req
        .withAll()
        .andWith({"successes": [{message:"Grupa veiksmīgi rediģēta"}]})
        .flash()
    res.route('group/show', {id: groupData.id})
  }
}

module.exports = GroupController
