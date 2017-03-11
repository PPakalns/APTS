'use strict'

const NE = use('node-exceptions')
const View = use('View')
const User = use('App/Model/User')
let basic_auth = require('basic-auth')

class AuthenticatedUserPopulate {

    * handle (req, res, next) {
        // Login user with basic auth
        if (!req.currentUser)
        {
            const basicAuth = req.auth.authenticator('basic')
            if (yield basicAuth.check())
            {
                let user_data = basic_auth(req.request)
                req.currentUser = yield User.findBy('email', user_data.name)
                if (!req.currentUser)
                {
                    throw Error("Authentication fail")
                }
            }
        }

        // Check if request model already is not modified
        if (req.cUser !== undefined )
            throw new NE.RuntimeException("CURRENT_USER_ALREADY_DEFINED")

        // User model to check permissions with
        // admin -> auth
        req.cUser = {
            auth: false,
            admin: false,
            judge: false,
            user: {},
            ruser: req.currentUser
        }

        if ( req.cUser.ruser )
        {
            req.cUser.auth = true;

            yield req.cUser.ruser.related('roles').load()
            req.cUser.user = req.cUser.ruser.toJSON()

            // Assign permissions to user depending on its roles
            let rolemap = {
                1: "admin",
                2: "judge"
            }

            let length = req.cUser.user.roles.length;
            for (let i=0; i<length; i++)
            {
                let role = req.cUser.user.roles[ i ];
                if (rolemap.hasOwnProperty(role.role))
                {
                    req.cUser[ rolemap[ role.role ] ] = true;
                }
            }
        }

        View.global('cUser', req.cUser)

        yield next
    }
}

module.exports = AuthenticatedUserPopulate
