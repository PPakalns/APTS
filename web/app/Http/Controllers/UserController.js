'use strict'

const Database = use('Database')
const User = use('App/Model/User')
const Group = use('App/Model/Group')

class UserController {

    * index(req, res) {
        const users = yield User.all()
        res.json(users)
    }

    * show(req, res) {
        // If user is not an admin - show only users own page
        let id = req.cUser.ruser.id
        if (req.cUser.admin){
            id = req.param('user_id', id)
        }
        let user = yield User.findOrFail(id)
        let data = {}
        const sub_cnt = yield Database.table('submissions').where('user_id', id).count()
        data.submissions = sub_cnt[ 0 ]['count(*)']

        yield res.sendView('user/show', {user: user.toJSON(), data: data})
    }

    // Returns list of emails which have search as substring
    * shortlist(req, res) {
        const search = ''+req.input('search')
        const notGroupId = req.param("not_group_id")

        let query = Database
            .select('email', 'id')
            .from('users')
            .whereRaw("INSTR(email,?) > 0",[search])
            .limit(10)

        if (notGroupId)
        {
            const group = yield Group.findOrFail(notGroupId)

            const subquery = Database
                .select('user_id')
                .from('user_group')
                .where('group_id', group.id)

            query = query.whereNotIn('id', subquery)
        }

        const users = yield query;

        res.json(users)
    }
}

module.exports = UserController
