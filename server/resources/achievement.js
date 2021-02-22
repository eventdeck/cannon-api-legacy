const Boom = require('boom')
const slug = require('slug')
const server = require('../').hapi
const log = require('../helpers/logger')
const fieldsParser = require('../helpers/fieldsParser')
const Achievement = require('../db/achievement')

server.method('achievement.create', create, {})
server.method('achievement.update', update, {})
server.method('achievement.updateMulti', updateMulti, {})
server.method('achievement.get', get, {})
server.method('achievement.getByUser', getByUser, {})
server.method('achievement.removeAllFromUser', removeAllFromUser, {})
server.method('achievement.list', list, {})
server.method('achievement.remove', remove, {})
server.method('achievement.addUser', addUser, {})
server.method('achievement.addMultiUsers', addMultiUsers, {})
server.method('achievement.addMultiUsersBySession', addMultiUsersBySession, {})
server.method('achievement.addUserToStandAchievement', addUserToStandAchievement, {})
server.method('achievement.addCV', addCV, {})
server.method('achievement.getPointsForUser', getPointsForUser, {})
server.method('achievement.removeCV', removeCV, {})
server.method('achievement.getActiveAchievements', getActiveAchievements, {})
server.method('achievement.generateCodeSession', generateCodeSession, {})
server.method('achievement.getActiveAchievementsCode', getActiveAchievementsCode, {})
server.method('achievement.getSpeedDatePointsForUser', getSpeedDatePointsForUser, {})
server.method('achievement.addUserToSpeedDateAchievement', addUserToSpeedDateAchievement, {})

function create (achievement, cb) {
  achievement.id = achievement.id || slug(achievement.name)

  log.error({id: achievement.id}, 'id')

  achievement.updated = achievement.created = Date.now()

  Achievement.create(achievement, (err, _achievement) => {
    if (err) {
      if (err.code === 11000) {
        return cb(Boom.conflict(`achievement "${achievement.id}" is a duplicate`))
      }

      log.error({ err: err, achievement: achievement.id }, 'error creating achievement')
      return cb(Boom.internal())
    }

    cb(null, _achievement.toObject({ getters: true }))
  })
}

function update (filter, achievement, cb) {
  if (typeof filter === 'string') {
    filter = { id: filter }
  }

  achievement.updated = Date.now()

  Achievement.findOneAndUpdate(filter, achievement, (err, _achievement) => {
    if (err) {
      log.error({ err: err, achievement: filter }, 'error updating achievement')
      return cb(Boom.internal())
    }
    if (!_achievement) {
      log.error({ err: err, achievement: filter }, 'error updating achievement')
      return cb(Boom.notFound())
    }

    cb(null, _achievement.toObject({ getters: true }))
  })
}

function updateMulti (filter, achievement, cb) {
  if (typeof filter === 'string') {
    filter = { id: filter }
  }

  achievement.updated = Date.now()

  Achievement.update(filter, achievement, { multi: true }, (err, _achievements) => {
    if (err) {
      log.error({ err: err, achievement: filter }, 'error updating achievements')
      return cb(Boom.internal())
    }
    if (!_achievements) {
      log.warn({ err: err, achievement: filter }, 'could not find achievements')
      return cb(Boom.notFound())
    }

    cb(null, _achievements)
  })
}

function get (filter, cb) {
  // log.debug({id: id}, 'getting achievement')

  if (typeof filter === 'string') {
    filter = { id: filter }
  }

  Achievement.findOne(filter, (err, achievement) => {
    if (err) {
      log.error({ err: err, achievement: filter }, 'error getting achievement')
      return cb(Boom.internal('error getting achievement'))
    }
    if (!achievement) {
      log.error({ err: 'not found', achievement: filter }, 'achievement not found')
      return cb(Boom.notFound('achievement not found'))
    }

    cb(null, achievement.toObject({ getters: true }))
  })
}

function getByUser (filter, cb) {
  // log.debug({id: id}, 'getting achievement')
  const now = new Date()

  filter = {
    users: { $in: [filter] },
    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }

  Achievement.find(filter, (err, achievements) => {
    if (err) {
      log.error({ err: err, achievement: filter }, 'error getting achievements')
      return cb(Boom.internal('error getting achievements'))
    }
    if (!achievements) {
      log.error({ err: 'not found', achievement: filter }, 'achievements not found')
      return cb(Boom.notFound('achievements not found'))
    }

    cb(null, achievements)
  })
}

function removeAllFromUser (userId, cb) {
  Achievement.update({ users: userId }, { $pull: { users: userId } }, { multi: true }, (err, achievements) => {
    if (err) {
      log.error({ err: err, userId: userId }, 'error removing user from multiple achievements')
      return cb(Boom.internal('error getting achievements'))
    }

    if (!achievements) {
      log.error({ err: 'not found', userId: userId }, 'achievements not found')
      return cb(Boom.notFound('achievements not found'))
    }

    cb(null, achievements)
  })
}

function list (query, cb) {
  cb = cb || query // fields is optional

  const filter = {}
  const fields = fieldsParser(query.fields)
  const options = {
    skip: query.skip,
    limit: query.limit,
    sort: fieldsParser(query.sort)
  }

  Achievement.find(filter, fields, options, (err, achievements) => {
    if (err) {
      log.error({ err: err }, 'error getting all achievements')
      return cb(Boom.internal())
    }

    cb(null, achievements)
  })
}

function remove (id, cb) {
  Achievement.findOneAndRemove({ id: id }, (err, achievement) => {
    if (err) {
      log.error({ err: err, achievement: id }, 'error deleting achievement')
      return cb(Boom.internal())
    }
    if (!achievement) {
      log.error({ err: 'not found', achievement: id }, 'error deleting achievement')
      return cb(Boom.notFound('achievement not found'))
    }

    return cb(null, achievement)
  })
}

function addCV (userId, cb) {
  const achievementKind = 'cv'
  const now = new Date()

  const changes = {
    $addToSet: {
      users: userId
    }
  }

  Achievement.findOneAndUpdate({
    kind: achievementKind,
    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }, changes, (err, achievement) => {
    if (err) {
      log.error({ err: err, achievement: achievement }, 'error adding user to cv achievement')
      return cb(Boom.internal())
    }

    if (achievement === null) {
      log.error({ userId: userId }, 'error trying to add user to cv achievement')
      return cb(new Error('error trying to add user to cv achievement'), null)
    }

    cb(null, achievement.toObject({ getters: true }))
  })
}

function removeCV (userId, cb) {
  const achievementKind = 'cv'
  const now = new Date()

  const changes = {
    $pull: {
      users: userId
    }
  }

  Achievement.findOneAndUpdate({
    kind: achievementKind,
    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }, changes, (err, achievement) => {
    if (err) {
      log.error({ err: err, achievement: achievement }, 'error removing user from cv achievement')
      return cb(Boom.internal())
    }

    if (achievement === null) {
      log.error({ userId: userId }, 'error trying to remove user from cv achievement')
      return cb(new Error('error trying to remove user from cv achievement'), null)
    }

    cb(null, achievement.toObject({ getters: true }))
  })
}

function addUser (achievementId, userId, cb) {
  if (!achievementId || !userId) {
    log.error({ userId: userId, achievementId: achievementId }, 'missing arguments on addUser')
    return cb()
  }
  const changes = {
    $addToSet: {
      users: userId
    }
  }

  const now = new Date()

  Achievement.findOneAndUpdate({
    id: achievementId,
    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }, changes, (err, achievement) => {
    if (err) {
      log.error({ err: err, achievement: achievementId }, 'error adding user to achievement')
      return cb(Boom.internal())
    }

    if (achievement === null) {
      log.error({ achievementId: achievementId, userId: userId }, 'error trying to add user to not valid achievement')
      return cb(new Error('error trying to add user to not valid achievement'), null)
    }

    cb(null, achievement.toObject({ getters: true }))
  })
}

function getPointsForUser (activeAchievements, userId, cb) {
  const result = { achievements: [], points: 0 }

  // list unique users at their points
  result.achievements = activeAchievements.filter((achievement) => {
    return achievement.users.indexOf(userId) !== -1 && achievement.kind !== 'speedDate'
  })

  // fill the points
  result.achievements.forEach(achv => {
    if (achv.kind !== 'speedDate') {
      result.points += achv.value
    } else {
      result.points += getSpeedDatePoints(achv, userId)
    }
  })

  cb(null, result)
}

function getSpeedDatePointsForUser (userId, cb) {
  const result = { achievements: [], points: 0 }
  const filter = {
    kind: 'speedDate'
  }

  Achievement.find(filter, (err, achievements) => {
    if (err) {
      log.error({err: err}, 'Error finding achievements')
    }

    achievements.forEach(ach => {
      result.points += getSpeedDatePoints(ach, userId)
      result.achievements.push({
        achievement: ach,
        frequence: userFrequence(ach, userId)
      })
    })

    return cb(null, result)
  })
}

function userFrequence (achievement, userId) {
  let count = 0
  achievement.users.forEach(u => {
    if (u === userId) {
      count++
    }
  })

  return count > 3 ? 3 : count
}

function getSpeedDatePoints (achievement, userId) {
  let count = 0
  let points = 0
  achievement.users.forEach(u => {
    if (u === userId) {
      points += count >= 3 ? 0 : achievement.value / Math.pow(2, count++)
    }
  })

  return points
}

function addMultiUsers (achievementId, usersId, cb) {
  if (!usersId) {
    log.error('tried to add multiple users to achievement but no users where given')
    return cb()
  }

  const changes = {
    $addToSet: {
      users: { $each: usersId }
    }
  }

  const now = new Date()

  Achievement.findOneAndUpdate({
    id: achievementId,
    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }, changes, (err, achievement) => {
    if (err) {
      log.error({ err: err, achievement: achievementId }, 'error adding user to achievement')
      return cb(Boom.internal())
    }

    cb(null, achievement.toObject({ getters: true }))
  })
}

function addMultiUsersBySession (sessionId, usersId, credentials, code, cb) {
  if (!usersId) {
    log.error('tried to add multiple users to achievement but no users where given')
    return cb()
  }

  const changes = {
    $addToSet: {
      users: { $each: usersId }
    }
  }

  const now = new Date()

  if (credentials.scope !== 'user') {
    Achievement.findOneAndUpdate({
      session: sessionId,
      'validity.from': { $lte: now },
      'validity.to': { $gte: now }
    }, changes, (err, achievement) => {
      if (err) {
        log.error({ err: err, sessionId: sessionId }, 'error adding user to achievement')
        return cb(Boom.internal())
      }

      if (achievement === null) {
        log.error({ sessionId: sessionId }, 'error trying to add multiple users to not valid achievement in session')
        return cb(new Error('error trying to add multiple users to not valid achievement in session'), null)
      }

      cb(null, achievement.toObject({ getters: true }))
    })
  } else {
    if (usersId.length === 1 && usersId[0] === credentials.user.id) {
      Achievement.findOneAndUpdate({
        session: sessionId,
        'validity.from': { $lte: now },
        'validity.to': { $gte: now },
        'code.created': {$lte: now},
        'code.expiration': {$gte: now},
        'code.code': code
      }, changes, (err, achievement) => {
        if (err) {
          log.error({ err: err, sessionId: sessionId }, 'error adding user to achievement')
          return cb(Boom.internal())
        }

        if (achievement === null) {
          log.error({ sessionId: sessionId }, 'error trying to add user to not valid achievement in session')
          return cb(Boom.notFound('error trying to add user to not valid achievement in session'), null)
        }

        cb(null, achievement.toObject({ getters: true }))
      })
    } else {
      return cb(Boom.badRequest('invalid payload for user self sign'), null)
    }
  }
}

function addUserToStandAchievement (companyId, userId, cb) {
  if (!userId) {
    log.error('tried to user to company achievement but no user was given')
    return cb()
  }

  const changes = {
    $addToSet: {
      users: userId
    }
  }

  const now = new Date()

  Achievement.findOneAndUpdate({
    id: { $regex: `stand-${companyId}-` },
    'kind': 'stand',
    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }, changes, (err, achievement) => {
    if (err) {
      log.error({ err: err, companyId: companyId, userId: userId }, 'error adding user to stand achievement')
      return cb(Boom.internal())
    }

    if (achievement === null) {
      log.error({ companyId: companyId, userId: userId }, 'error trying to add user to not valid stand achievement')
      return cb(new Error('error trying to add user to not valid stand achievement'), null)
    }

    cb(null, achievement.toObject({ getters: true }))
  })
}

function addUserToSpeedDateAchievement (companyId, userId, cb) {
  if (!userId) {
    log.error('tried to user to company achievement but no user was given')
    return cb()
  }

  const changes = {
    $push: {
      users: userId
    }
  }

  const now = new Date()

  Achievement.findOneAndUpdate({
    id: { $regex: `speedDate-${companyId}-` },
    'kind': 'speedDate',
    'validity.from': { $lte: now },
    'validity.to': { $gte: now }
  }, changes, (err, achievement) => {
    if (err) {
      log.error({ err: err, companyId: companyId, userId: userId }, 'error adding user to speed date achievement')
      return cb(Boom.internal())
    }

    if (achievement === null) {
      log.error({ companyId: companyId, userId: userId }, 'error trying to add user to not valid speed date achievement')
      return cb(new Error('error trying to add user to not valid stand achievement'), null)
    }

    cb(null, achievement.toObject({ getters: true }))
  })
}

// _date is a string, converted to Date inside this function
function getActiveAchievements (query, cb) {
  var date
  cb = cb || query

  if (query.date === undefined) {
    date = new Date() // now
  } else {
    date = new Date(query.date)
    if (isNaN(date.getTime())) {
      log.error({ query: query.date }, 'invalid date given on query to get active achievements')
      return cb(Boom.notAcceptable('invalid date given in query'))
    }
  }

  Achievement.find({
    'validity.from': { $lte: date },
    'validity.to': { $gte: date }
  }, (err, achievements) => {
    if (err) {
      log.error({ err: err, date: date }, 'error getting active achievements on a given date')
      return cb(err)
    }

    cb(null, achievements)
  })
}

function getActiveAchievementsCode (query, cb) {
  var start, end
  cb = cb || query

  if (query.start === undefined) {
    start = new Date() // now
  } else {
    start = new Date(query.start)
    if (isNaN(start.getTime())) {
      log.error({ query: query.start }, 'invalid start date given on query to get active achievements')
      return cb(Boom.notAcceptable('invalid start date given in query'))
    }
  }
  if (query.end === undefined) {
    end = new Date() // now
  } else {
    end = new Date(query.end)
    if (isNaN(end.getTime())) {
      log.error({ query: query.end }, 'invalid end date given on query to get active achievements')
      return cb(Boom.notAcceptable('invalid end date given in query'))
    }
  }

  if (end < start) {
    log.error({start: start, end: end}, 'end date is before start date')
  }

  Achievement.find({
    'validity.from': { $gte: start },
    'validity.to': { $lte: end }
  }, (err, achievements) => {
    if (err) {
      log.error({ err: err, start: start, end: end }, 'error getting active achievements on a given date')
      return cb(err)
    }

    cb(null, achievements)
  })
}

function generateCodeSession (sessionId, expiration, cb) {
  if (!expiration) {
    log.error('No duration was given')
    return cb(new Error('No duration was given'))
  }

  let created = new Date()
  let expires = new Date(expiration)
  if (created >= expires) {
    log.error({expires: expires}, 'expiration date is in the past')
    return cb(new Error('expiration date is in the past'))
  }

  let code = randomString(12)

  const changes = {
    $set: {
      code: {
        created: created,
        expiration: expires,
        code: code
      }
    }
  }

  Achievement.findOneAndUpdate({
    session: sessionId,
    'validity.to': { $gte: created }
  }, changes, (err, achievement) => {
    if (err) {
      log.error({ err: err, sessionId: sessionId }, 'error adding code to achievement')
      return cb(Boom.internal())
    }

    if (achievement === null) {
      log.error({ sessionId: sessionId }, 'error trying to code to not valid achievement in session')
      return cb(new Error('error trying to add code to not valid achievement in session'), null)
    }

    cb(null, achievement.toObject({ getters: true }))
  })
}

function randomString (size) {
  var text = ''
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (var i = 0; i < size; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}
