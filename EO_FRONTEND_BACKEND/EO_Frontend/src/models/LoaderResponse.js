export default class LoaderResponse {
  constructor(config = {}) {
    this.rdata = null
    this.statuscode = 400
    this.errormsg = 'Success'
    if (Object.keys(config).includes('data')) {
      config['rdata'] = config['data']
      delete config['data']
    }
    Object.assign(this, config)
  }
  get data() {
    return this.rdata
  }
  get status() {
    return this.statuscode
  }
  get message() {
    return this.errormsg
  }
  get isValid() {
    return this.statuscode === 200
  }
}
