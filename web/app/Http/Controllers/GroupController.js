'use strict'

const Group = use('App/Model/Group')
const User = use('App/Model/User')
const Validator = use('Validator')
const Database = use('Database')
const Assignment = use('App/Model/Assignment')
const File = use('App/Model/File')
const RegisterController = use('App/Http/Controllers/RegisterController')

const parse = require('csv-parse')
const fs = require('fs');

class GroupController {

    * index(req, res) {

        let groups = []
        if (req.cUser.auth)
            groups = (yield req.currentUser.groups().fetch()).toJSON()

        // Public group list
        let pgroups = null
        if (req.cUser.auth)
        {
            let subquery = Database.select('id').from('user_group')
                .where('user_id', req.cUser.user.id).whereRaw('user_group.group_id = groups.id')
            pgroups = (
                yield Group.query().where('public', true).whereNotExists(subquery).fetch()
            ).toJSON()
        }
        else
        {
            pgroups = (
                yield Group.query().where('public', true).fetch()
            ).toJSON()
        }

        // Group list for admins
        let agroups = []
        if (req.cUser.admin)
            agroups = (yield Group.all()).toJSON()

        yield res.sendView('group/list', {groups: groups, agroups: agroups, pgroups: pgroups})
    }

  * show(req, res) {
    const id = req.param('id')
    const group = yield Group.findOrFail(id)
    const participantCount = (yield group.users().count())[ 0 ][ 'count(*)' ]

    // Check if user is assigned to this group
    const isParticipant =
        ((yield Database
          .table('user_group')
          .where('user_id', req.cUser.user.id)
          .where('group_id', group.id)
        ).length)

    if (!isParticipant && !req.cUser.admin)
    {
      yield req
        .with({errors: [{message: "Jums nav vajadzīgās tiesības, lai skatītu pieprasīto lapu."}]})
        .flash()

      res.route('group/list')
      return
    }

    let aquery = Assignment.query().with('problem').where('group_id', group.id)
    if (!req.cUser.admin)
        aquery = aquery.visible()

    let assignments = yield aquery.fetch()

    yield res.sendView('group/show', {
        group: group.toJSON(),
        participantCount: participantCount,
        assignments: assignments.toJSON()
    })
  }

  * edit(req, res) {
    const id = req.param('id')
    const group = yield Group.findOrFail(id)

    yield res.sendView('group/edit', {group: group.toJSON()})
  }

  * edit_save(req, res) {
    const groupData = req.only('id', 'name', 'description', 'public')
    groupData.public = Validator.sanitizor.toBoolean(groupData.public)

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
    group.public = groupData.public;
    yield group.save()

    yield req
        .withAll()
        .andWith({"successes": [{message:"Grupa veiksmīgi rediģēta"}]})
        .flash()
    res.route('group/edit', {id: groupData.id})
  }

  * create(req, res) {
    yield res.sendView('group/edit', {form_heading: "Izveidot grupu", create: true})
  }

  * create_save(req, res) {
    let groupData = req.only('name', 'description', 'public')
    groupData.public = Validator.sanitizor.toBoolean(groupData.public)

    const validation = yield Validator.validate(groupData, Group.rules)
    if (validation.fails())
    {
      yield req
        .withAll()
        .andWith({"errors": [{message:"Lūdzu norādiet grupas nosaukumu."}]})
        .flash()
      res.route('group/create')
      return
    }

    const group = new Group()
    group.name = groupData.name;
    group.description = groupData.description;
    group.public = groupData.public;
    yield group.save()

    yield req
        .withAll()
        .andWith({"successes": [{message:"Grupa veiksmīgi izveidota!"}]})
        .flash()
    res.route('group/show', {id: group.id})
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
    const user = yield User.findOrFail(formData.user_id)

    const isowned = yield group.users().where("users.id", user.id).fetch()

    if ( isowned.size() == 0 )
    {
      yield req
        .with({"successes": [{message:"Lietotājs "+user.email+" veiksmīgi pievienots grupai."}]})
        .flash()
      yield group.users().attach([user.id])
    }
    else
    {
      yield req
        .withAll()
        .andWith({"errors": [{message:"Lietotājs "+user.email+" jau ir pievienots grupai!"}]})
        .flash()
    }

    res.route('group/users', {id: formData.group_id})
  }


    * users_add_csv(req, res){
        const group_id = req.input('group_id')
        let group = yield Group.findOrFail(group_id)
        const email = req.input('email', '')
        const student_id = req.input('student_id', '')

        let errors = []

        if (!Validator.is.string(email) || !Validator.is.string(student_id))
            errors.push({msg: "Nekorekti kolumnu nosaukumi!"})
        else if (email == student_id)
            errors.push({msg: "Nav norādīts epasta kolumnas vārds"})
        else if (email.length == 0)
            errors.push({msg: "Nav norādīta epasta kolumna!"})

        let csv_opt = {
            maxSize: '10mb',
            allowedExtensions: ['csv']
        }

        let file = yield File.uploadFile(req, 'csv', csv_opt, false, errors)

        if (!file || errors.length>0)
        {
            if (file)
                yield file.delete()
            yield req.withAll().andWith({errors: errors}).flash()
            return res.redirect('back')
        }

        let async_csv_parser = new Promise(function(resolve, reject){
            let stats = {
                data: [],
                student_id_column: false,
                lines: 0,
                good: 0
            }
            fs.createReadStream(file.path).pipe(parse({columns: true}))
                .on('data', (row) => {
                    stats.lines += 1
                    if (row.hasOwnProperty(email))
                    {
                        if (!Validator.is.email(row[email]))
                            return

                        let row_email = Validator.sanitizor.normalizeEmail(row[email], ['!rd']).trim()

                        let row_student_id = undefined

                        if (row.hasOwnProperty(student_id))
                        {
                            stats.student_id_column = true
                            row_student_id = String(row[student_id]).trim()
                        }
                        stats.data.push({email: row_email, student_id: row_student_id})
                        stats.good += 1
                    }
                })
                .on('error', e => {
                    reject(e);
                })
                .on('end', () => {
                    resolve(stats);
                });
        })

        let stats = null
        try{
            stats = yield async_csv_parser
        }catch (e){
            console.error(e)
            errors.push({msg: "Kļūda csv faila apstrādē"})
        }finally{
            if (file)
                yield file.delete()
        }

        if (errors.length > 0)
        {
            yield req.withAll().andWith({errors: errors}).flash()
            return res.redirect('back')
        }

        let old_cnt = 0, new_cnt = 0, new_student_id_cnt = 0, added = 0

        // Parse list of emails and student_id
        for (let user of stats.data)
        {
            let fuser = yield User.findBy('email', user.email)
            console.log(user, fuser)
            if (fuser)
            {
                old_cnt += 1
            }
            else
            {
                // Create new user and send registration email
                fuser = yield RegisterController.new_user(user.email)
                new_cnt += 1
            }

            // Add student id
            if (user.student_id && user.student_id != fuser.student_id)
            {
                fuser.student_id = user.student_id
                new_student_id_cnt += 1
                yield fuser.save()
            }

            // Add user to group
            const isowned = yield group.users().where("users.id", fuser.id).fetch()
            if (isowned.size() == 0)
            {
                added += 1
                yield group.users().attach([fuser.id])
            }
        }

        let successes = [{msg: "Lietotāji veiksmīgi pievienoti"}]

        let infos = [{msg: "Apstrādātas "+stats.good+" rindas!"}]
        if (new_cnt)
            infos.push({msg: "Sistēmā piereģistrēti " + new_cnt + " jauni lietotāji"})
        if (new_student_id_cnt)
            infos.push({msg: new_student_id_cnt + " lietotājiem pievienots studenta apliecības numurs"})
        infos.push({msg: "Grupai pievienot papildus " + added + " lietotāji"})

        let warnings = []

        if (stats.student_id_column == false)
            warnings.push({msg: "Nevienam ierakstam csv failā nav piesaistīts studenta apliecības numurs."})

        if (stats.good == 0)
            warnings.push({msg: "Fails nesaturēja nevienu rindu ar korektu epasta adresi"})

        if (stats.lines - stats.good > 0)
            warnings.push({msg: String(stats.lines - stats.good) + " rindas nesaturēja epasta adresi csv failā."})


        yield req.withAll().andWith({warnings, infos, successes}).flash()
        res.redirect('back')
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
