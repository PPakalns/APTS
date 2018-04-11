
const { ServiceProvider } = require('@adonisjs/fold')

const recaptcha2 = require('recaptcha2')

class Recaptcha2 extends ServiceProvider {
  recaptcha() {
    if (this._recaptcha)
      return this._recaptcha
    const Config = this.app.use('Adonis/Src/Config')
    const Env = this.app.use('Adonis/Src/Env')
    this._recaptcha = new recaptcha2({
      siteKey: Env.get('reCAPTCHA_SITE_KEY', 'site_key'),
      secretKey: Env.get('reCAPTCHA_SECRET_KEY', 'secret_key'),
      ssl: true
    });
    return this._recaptcha
  }


  register() {
    this.app.singleton('Recaptcha2', () => {
      return this.recaptcha();
    })
  }

  boot () {
    const View = this.app.use('Adonis/Src/View')
    let captcha = this.recaptcha()

    View.global('recaptcha', function(className) {
      if (className)
        return captcha.formElement(className);
      return captcha.formElement();
    })
  }
}

module.exports = Recaptcha2
