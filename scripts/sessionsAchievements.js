const server = require('../server').hapi
const API = server.methods
const log = require('../server/helpers/logger')
const async = require('async')
const EVENT = '26-sinfo'

API.session.list({event: EVENT}, (err, sessions) => {
  log.debug({err: err, count: sessions.length}, 'got sessions')
  
  async.each(sessions, (session, cb) => {
    let achievementValue = 0
    switch (session.kind) {
      case 'Keynote':
        achievementValue = 10
        break
      case 'Workshop':
        achievementValue = 20
        break
      case 'Presentation':
        achievementValue = 30
        break
      default:
        achievementValue = 10
    }

    const sessionAchievement = {
      'name': `Went to "${session.name}"`,
      'id': 'session-' + session.id,
      'session': session.id,
      'value': achievementValue,
      'img': `https://sinfo.ams3.cdn.digitaloceanspaces.com/static/${EVENT}/achievements/${session.kind.toLowerCase()}/${session.id}.png`,
      'validity': {
        'from': new Date(),
        'to': new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7) // 1 week
      }
    }

    // log.debug({sessionAchievement: sessionAchievement}, 'creating achievement');

    API.achievement.create(sessionAchievement, (err, achievement) => {
      if (err) {
        log.warn({err: err, sessionAchievement: sessionAchievement}, 'achievement')
      }

      cb()
    })
  }, (err) => {
    log.info({err: err}, 'achievements created')

    const sessionAchievement = {
      'name': `Submitted CV`,
      'id': 'submitted-cv-' + EVENT,
      'value': 0,
      'kind': 'cv',
      'img': `https://sinfo.ams3.cdn.digitaloceanspaces.com/static/${EVENT}/achievements/cv/cv.png`,
      'validity': {
        'from': new Date(),
        'to': new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7) // 1 week
      }
    }
  
    // log.debug({sessionAchievement: sessionAchievement}, 'creating achievement');
  
    API.achievement.create(sessionAchievement, (err, achievement) => {
      if (err) {
        log.warn({err: err, sessionAchievement: sessionAchievement}, 'achievement')
      }
  
      cb()
    })

    process.exit(0)
  })
  
})
