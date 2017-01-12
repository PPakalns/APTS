'use strict'

const Group = use('App/Model/Group')
const User = use('App/Model/User')
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
    const groupData = req.only('id', 'name', 'description')

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

  * users(req, res){
    const id = req.param('id')
    const group = yield Group.findOrFail(id)
    yield group.related('users').load()

    yield res.sendView('group/users', {group: group.toJSON()})
  }

  * users_add(req, res){
    const formData = req.all()
    const group = yield Group.findOrFail(formData.group_id)
    var user = yield User.query().where('email', formData.email).limit(1)

    if (user.length == 0 )
    {
      yield req
        .withAll()
        .andWith({"errors": [{message:"Lietotājs "+formData.email+" neeksistē. Lūdzu pārbaudiet pareizrakstību."}]})
        .flash()
    }
    else if (user.length == 1 )
    {
      user = user[ 0 ]
      const isowned = yield group.users().where("users.id", user.id).fetch()

      if ( isowned.size() == 0 )
      {
        yield req
          .with({"successes": [{message:"Lietotājs "+formData.email+" veiksmīgi pievienots grupai."}]})
          .flash()
        yield group.users().attach([user.id])
      }
      else
      {
        yield req
          .withAll()
          .andWith({"errors": [{message:"Lietotājs "+formData.email+" jau ir pievienots grupai!"}]})
          .flash()
      }
    }

    res.route('group/users', {id: formData.group_id})
  }

  * users_remove(req, res){

    const formData = req.all()
    const group = yield Group.findOrFail(formData.group_id)

    var remove_users = []

    // Parse checkbox names to determine which users to remove from group
	  var checkbox_regex = /^user_(\d+)$/
    for (var property in formData) {
      if (formData.hasOwnProperty(property)) {
        var match = property.match(checkbox_regex);
        if (match)
        {
          var user_id = parseInt(match[1])
          remove_users.push( user_id )
        }
      }
    }

    yield group.users().detach(remove_users)

    // Display flash message to user
    if ( remove_users.length == 0 )
    {
      yield req
        .with({"errors": [{message: "Lai noņemtu dalībniekus no grupas, atzīmējiet tos ar ķeksi kolumnā \"Noņemt\"."}]})
        .flash()
    }
    else
    {
      yield req
        .with({"successes": [{message: "Veiksmīgi noņemti " + remove_users.length + " dalībniek"+(remove_users.length==1?"s":"i")+" no grupas!"}]})
        .flash()
    }

    res.route('group/users', {id: formData.group_id});
  }
}

module.exports = GroupController
