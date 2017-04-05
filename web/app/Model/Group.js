'use strict'

const Lucid = use('Lucid')
const Database = use('Database')

class Group extends Lucid {

    static * participant(req, group)
    {
        return (yield Database
            .table('user_group')
            .where('user_id', req.cUser.user.id)
            .where('group_id', group.id)
        ).length
    }

    static * access(group, req, res, express=true) {
        let isAccess = group.public
        if (req.cUser.auth && !isAccess && express)
        {
            isAccess = isAccess || (yield Group.participant(req, group))
        }

        if ((!express || !isAccess) && !req.cUser.admin)
        {
            yield req
                .with({errors: [{message: "Jums nav vajadzīgās tiesības, lai skatītu pieprasīto lapu."}]})
                .flash()

            res.route('group/list')
            return false
        }
        return true
    }

    static get rules () {
        return {
            name: 'required|max:524'
        }
    }

    users () {
        return this.belongsToMany('App/Model/User', 'user_group')
    }

    assignments() {
        return this.hasMany('App/Model/Assignment', 'id', 'group_id')
    }
}

module.exports = Group
