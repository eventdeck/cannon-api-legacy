var Joi = require('joi');
var log = require('server/helpers/logger');
var render = require('server/views/achievement');


var handlers = module.exports;

exports.create = {
  tags: ['api','achievement'],
  auth: {
    strategies: ['default', 'backup'],
    scope: ['admin']
  },
  validate: {
    payload: {
      id: Joi.string().description('Id of the achievement'),
      name: Joi.string().required().description('Name of the achievement'),
      event: Joi.string().default('22').description('Event the achievement is associated to'),
      session: Joi.string().description('Id of a session associated to this achievement'),
      img: Joi.string().description('Image of the achievement'),
      description: Joi.string().description('Description of the achievement'),
      category: Joi.string().description('Category of the achievement'),
      instructions: Joi.string().description('Instructions on how to get the achievement'),
      value: Joi.number().description('Amount of points associated to the achievement'),
    }
  },
  pre: [
    { method: 'achievement.create(payload)', assign: 'achievement' }
  ],
  handler: function (request, reply) {
    reply(render(request.pre.achievement)).created('/achievement/'+request.pre.achievement.id);
  },
  description: 'Creates a new achievement'
};


exports.update = {
  tags: ['api','achievement'],
  auth: {
    strategies: ['default', 'backup'],
    scope: ['admin']
  },
  validate: {
    params: {
      id: Joi.string().required().description('Id of the achievement we want to update'),
    },
    payload: {
      name: Joi.string().description('Name of the achievement'),
      event: Joi.string().description('Event the achievement is associated to'),
      session: Joi.string().description('Id of a session associated to this achievement'),
      category: Joi.string().description('Category of the achievement'),
      description: Joi.string().description('Description of the achievement'),
      instructions: Joi.string().description('Instructions on how to get the achievement'),
      img: Joi.string().description('Image of the achievement'),
      value: Joi.number().description('Amount of points associated to the achievement'),
    }
  },
  pre: [
    { method: 'achievement.update(params.id, payload)', assign: 'achievement' }
  ],
  handler: function (request, reply) {
    reply(render(request.pre.achievement));
  },
  description: 'Updates an achievement'
};


exports.get = {
  tags: ['api','achievement'],
  auth: {
    strategies: ['default', 'backup'],
    scope: ['user', 'admin'],
    mode: 'try'
  },
  validate: {
    query: {
      fields: Joi.string().description('Fields we want to retrieve'),
    },
    params: {
      id: Joi.string().required().description('Id of the achievement we want to retrieve'),
    }
  },
  pre: [
    { method: 'achievement.get(params.id)', assign: 'achievement' }
  ],
  handler: function (request, reply) {
    reply(render(request.pre.achievement));
  },
  description: 'Gets an achievement'
};

exports.get = {
  tags: ['api','achievement'],
  auth: {
    strategies: ['default', 'backup'],
    scope: ['user', 'admin'],
    mode: 'try'
  },
  validate: {
    query: {
      fields: Joi.string().description('Fields we want to retrieve'),
    },
    params: {
      id: Joi.string().required().description('Id of the achievement we want to retrieve'),
    }
  },
  pre: [
    { method: 'achievement.get(params.id)', assign: 'achievement' }
  ],
  handler: function (request, reply) {
    reply(render(request.pre.achievement));
  },
  description: 'Gets an achievement'
};

exports.getUser = {
  tags: ['api','achievement'],
  auth: {
    strategies: ['default', 'backup'],
    scope: ['user', 'admin'],
    mode: 'try'
  },
  validate: {
    query: {
      fields: Joi.string().description('Fields we want to retrieve'),
    },
    params: {
      id: Joi.string().required().description('Id of the user we want to retrieve'),
    }
  },
  pre: [
    { method: 'achievement.getByUser(params.id)', assign: 'achievements' }
  ],
  handler: function (request, reply) {
    reply(render(request.pre.achievements));
  },
  description: 'Gets user achievements'
};


exports.list = {
  tags: ['api','achievement'],
  auth: {
    strategies: ['default', 'backup'],
    scope: ['user', 'admin'],
    mode: 'try'
  },
  validate: {
    query: {
      fields: Joi.string().description('Fields we want to retrieve'),
    }
  },
  pre: [
    { method: 'achievement.list(query)', assign: 'achievements' }
  ],
  handler: function (request, reply) {
    reply(render(request.pre.achievements));
  },
  description: 'Gets all the achievements'
};


exports.remove = {
  tags: ['api','achievement'],
  auth: {
    strategies: ['default', 'backup'],
    scope: ['admin']
  },
  validate: {
    params: {
      id: Joi.string().required().description('Id of the achievement we want to remove'),
    }
  },
  pre: [
    { method: 'achievement.remove(params.id)', assign: 'achievement' }
  ],
  handler: function (request, reply) {
    reply(render(request.pre.achievement));
  },
  description: 'Removes an achievement'
};
