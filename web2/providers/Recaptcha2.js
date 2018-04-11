
const { ServiceProvider } = require('@adonisjs/fold')

const recaptcha2 = require('recaptcha2')

class Recaptcha2 extends ServiceProvider {

  register() {
    this.app.singleton('Recaptcha2', () => {
      return this.wrapper;
    })
  }

  boot () {
    this.faked = false

    const Config = this.app.use('Adonis/Src/Config')
    const Env = this.app.use('Adonis/Src/Env')
    this.recaptcha = new recaptcha2({
      siteKey: Env.get('reCAPTCHA_SITE_KEY', 'site_key'),
      secretKey: Env.get('reCAPTCHA_SECRET_KEY', 'secret_key'),
      ssl: true
    });

    this.wrapper = {
      formElement: (className) => {
        if (this.faked) {
          return ""
        }
        return this.recaptcha.formElement(className)
      },
      fake: () => {
        this.faked = true
      },
      restore: () => {
        this.faked = false
      },
      validate: async (key) => {
        if (this.faked) {
          return true
        }
        await this.recaptcha.validate(key)
      }
    }

    const View = this.app.use('Adonis/Src/View')
    // Register form renderer
    View.global('recaptcha', (className) => {
      return this.wrapper.formElement(className);
    })
  }
}

module.exports = Recaptcha2
