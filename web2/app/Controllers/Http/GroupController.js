'use strict'

const Group = use('App/Models/Group')
const Assignment = use('App/Models/Assignment')
const User = use('App/Models/User')
const File = use('App/Models/File')
const Validator = use('Validator')
const Antl = use('Antl')

const fs = require('fs')
const CsvParse = require('csv-parse')

class GroupController {

  async index ({ request, view, auth }) {

    // List of groups where user is participating
    let groups = []
    if (request.roles.auth) {
      let user = await auth.getUser()
      groups = (await user.groups().fetch()).toJSON()
    }

    // List of all public groups
    let publicGroups = await Group.query().where('public', true).fetch()

    // List of all groups for admin
    let allGroups = []
    if (request.roles.admin) {
      allGroups = (await Group.all()).toJSON()
    }

    return view.render('groups.index',
                       { groups: groups,
                         publicGroups: publicGroups.toJSON(),
                         allGroups: allGroups })
  }

  async show (ctx) {
    const group = await Group.findOrFail(ctx.params.id)

    // Check view permissions
    if ((await Group.checkViewPermission(ctx, group)) == false) {
      return;
    }

    return ctx.view.render('groups.show',
      { group: group.toJSON(),
        groupVisibleAssignments: await Assignment.getGroupVisibleAssignments(group),
      })
  }

  async create ({ view }) {
    return view.render('groups.create')
  }

  async store ({ request, response }) {
    const data = request.only(['name', 'description', 'public'])
    data.public = !!data.public;

    const group = await Group.create(data)
    return response.route('GroupController.show', {id: group.id})
  }

  async edit ({ params, view }) {
    const group = await Group.findOrFail(params.id)
    return view.render('groups.edit',
      { group: group.toJSON(),
      })
  }

  async update ({ request, response, params }) {
    const data = request.only(['name', 'description', 'public'])
    data.public = !!data.public;

    const group = await Group.findOrFail(params.id)
    group.merge(data)
    await group.save()

    return response.route('GroupController.show', {id: group.id})
  }

  async participants ({ params, view }) {
    const group = await Group.findOrFail(params.id)
    await group.load('users')

    let participantIdList = []
    let participants = group.toJSON().users
    for (let user of participants) {
      participantIdList.push(user.id)
    }

    let candidates = await User.query()
                               .whereNotIn('id', participantIdList)
                               .fetch()

    return view.render('groups.participants',
      { candidates: candidates.toJSON(),
        group: group.toJSON(),
      })
  }

  async addParticipant ({ params, response, session, antl }) {
    let group = await Group.findOrFail(params.id)
    let user = await User.findOrFail(params.user_id)

    if ((await Group.isParticipant(user, group)) == true) {
      session.flash({ error: antl.formatMessage('main.already_a_participant', user.toJSON()) })
      return response.redirect('back')
    }

    await user.groups().attach([group.id])

    session.flash({ success: antl.formatMessage('main.participant_added', user.toJSON()) })
    return response.redirect('back')
  }

  async removeParticipant ({ params, session, response, antl }) {
    let group = await Group.findOrFail(params.id)
    let user = await User.findOrFail(params.user_id)

    if ((await Group.isParticipant(user, group)) == false) {
      session
        .flash({ error: antl.formatMessage('main.already_a_non_participant', user.toJSON()) })
      return response.redirect('back')
    }

    await user.groups().detach([group.id])

    session.flash({ success: antl.formatMessage('main.participant_removed', user.toJSON()) })
    return response.redirect('back')
  }

  async importParticipantCSV(ctx) {
    let { params, request, session, response, antl } = ctx
    let group = await Group.findOrFail(params.id)
    let data = await request.only(['student_id', 'email'])

    let csv = await File.upload(ctx, 'csv', ['text', 'text/csv'], false, '10MB')
    if (!csv) {
      return
    }

    let stats = null

    try {
      stats = await parseCsv(csv, data.student_id, data.email)
    } catch (error) {
      await csv.delete()
      session.flash({ error: error.message || error })
      return response.redirect('back')
    }
    await csv.delete()

    let existing_users = 0, created_users = 0, added_to_group = 0, updated_student_id = 0

    for (let cuser of stats.data) {
      let user = await User.findBy('email', cuser.email)
      if (user) {
        existing_users += 1
      } else {
        user = await User.newUser(cuser.email)
        created_users += 1
      }

      if (cuser.student_id && user.student_id != cuser.student_id) {
        user.student_id = cuser.student_id
        updated_student_id += 1
        await user.save()
      }

      const isowned = (await group.users().where("users.id", user.id).fetch()).size()
      if (!isowned) {
        added_to_group += 1
        await group.users().attach([user.id])
      }
    }

    session
      .flash({ success: antl.formatMessage('main.csv_imported',
        {existing_users, created_users, added_to_group, updated_student_id }) })
    return response.redirect('back')
  }
}

function parseCsv(file, student_id_column, email_column) {
  return new Promise(function(resolve, reject) {
  let stats = {
      data: [],
      lines: 0,
      good: 0
  }
  let readStream = fs.createReadStream(file.path).pipe(CsvParse({columns: true}))
  readStream
    .on('data', (row) => {
      stats.lines += 1
      console.log(row)
      if (row.hasOwnProperty(email_column) == false ||
          Validator.is.email(row[email_column]) == false) {
        readStream.destroy()
        reject(Antl.formatMessage('main.dont_have_email_column', { column_name: email_column }))
        return
      }
      if (row.hasOwnProperty(student_id_column) == false) {
        readStream.destroy()
        reject(Antl.formatMessage('main.dont_have_student_id_column', { column_name: email_column }))
        return
      }

      let email = Validator.sanitizor.normalizeEmail(row[email_column])
      let student_id = row[student_id_column].trim()

      stats.data.push({ email, student_id })
      stats.good += 1
    })
    .on('error', e => {
      reject(e);
    })
    .on('end', () => {
      resolve(stats);
    });
  })
}

module.exports = GroupController
