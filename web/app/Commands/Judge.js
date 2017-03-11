'use strict'

const AppJudge = use('App/Model/Judge')
const Command = use('Command')
const Hash = use('Hash')

class Judge extends Command {


    get signature () {
        return 'judge'
    }


    get description () {
        return 'Setup, remove, add judge'
    }


    * CreateJudge() {

        const name = yield this
            .ask('Enter judge name')
            .print()

        const pass1 = yield this
            .secure('Enter judge password')
            .print()

        const pass2 = yield this
            .secure('Enter judge password again')
            .print()

        if (pass1 != pass2)
        {
            this.error("Passwords do not match!")
            return
        }

        if (pass1.length < 8)
        {
            this.error("Password is too short!")
            return
        }

        const pass = yield Hash.make(pass1)

        const desc = yield this
            .ask('Short description about judge')
            .print()

        let judge = new AppJudge()
        judge.name = name
        judge.description = desc
        judge.status = "Created"
        judge.disabled = false
        judge.pass = pass
        judge.tested = 0
        yield judge.save()

        this.success("Judge created")
    }


    * ListJudges(){
        let judges = yield AppJudge.all()

        if (judges.size() == 0)
        {
            this.success("There are no judges")
            return
        }

        let judget = []

        for (let judge of judges)
        {
            judget.push([
                ""+judge.name,
                ""+judge.disabled,
                ""+judge.description,
                ""+judge.status,
                ""+judge.ip,
                ""+judge.tested,
                ""+judge.updated_at
            ])
        }

        this.table(
            ['name', 'disabled', 'description', 'status', 'ip', 'tested', "last_update"],
            judget
        )
    }

    * getJudge() {
        let judges = yield AppJudge.all()

        if (judges.size() == 0)
            return null

        let judget = []
        let rr = {}
        for (let judge of judges)
        {
            let tmp = judge.name + ":" + judge.disabled
            judget.push(tmp)
            rr[ tmp ] = judge
        }

        const choice = yield this
            .choice('Choose a free daily meal', judget)
            .print()

        return rr[ choice ]
    }

    * toggleJudge() {
        let judge = yield this.getJudge()
        if (!judge)
        {
            this.error("Judge not found")
            return
        }
        judge.disabled = !judge.disabled;
        yield judge.save()
        this.success("Judge disable state toggled")
    }

    * RemoveJudge() {
        let judge = yield this.getJudge()
        if (!judge)
        {
            this.error("Judge not found")
            return
        }
        yield judge.delete()
        this.success("Judge removed")
    }

    * ChangePassword() {

        let judge = yield this.getJudge()

        if (!judge)
        {
            this.error("Judge not found")
            return
        }

        const pass1 = yield this
            .secure('Enter judge password')
            .print()

        const pass2 = yield this
            .secure('Enter judge password again')
            .print()

        if (pass1 != pass2)
        {
            this.error("Passwords do not match!")
            return
        }

        if (pass1.length < 8)
        {
            this.error("Password is too short!")
            return
        }

        const pass = yield Hash.make(pass1)
        judge.pass = pass
        yield judge.save()

        this.success("Password changed")
    }

    * handle (args, options) {
        while (true)
        {
            let choices = ['Create judge', 'List judges', 'Toggle judge (disabled)', 'Remove judge', 'Change password']
            const job = yield this.choice('Choose:', choices, choices[ 1 ]).print()

            switch (job){
                case choices[ 0 ]:
                    yield this.CreateJudge()
                    break;
                case choices[ 1 ]:
                    yield this.ListJudges()
                    break;
                case choices[ 2 ]:
                    yield this.toggleJudge()
                    break;
                case choices[ 3 ]:
                    yield this.RemoveJudge()
                    break;
                case choices[ 4 ]:
                    yield this.ChangePassword()
                    break;
                default:
                    return
            }
        }
    }

}

module.exports = Judge
