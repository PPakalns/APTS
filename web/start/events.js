const Event = use('Event')

Event.on('mail:registration', 'MailListener.newUser')
Event.on('mail:reset_password', 'MailListener.resetPassword')
