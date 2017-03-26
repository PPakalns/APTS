'use strict'

const NE = use('node-exceptions')
const View = use('View')

class AuthenticatedUserPopulate {

    * handle (req, res, next) {
        // Check if request model already is not modified
        if (req.cUser !== undefined )
            throw new NE.RuntimeException("CURRENT_USER_ALREADY_DEFINED")

        // User model to check permissions with
        // admin -> auth
        req.cUser = {
            auth: false,
            admin: false,
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
                1: "admin"
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

        res.viewInstance.global('cUser', req.cUser)

        yield next
    }
}

module.exports = AuthenticatedUserPopulate
