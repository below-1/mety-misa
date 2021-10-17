const multer = require('fastify-multer')
const upload = multer()

module.exports = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    reply.view('landing/index')
  })

  fastify.register(require('./auth'), {
    prefix: '/auth'
  })

  fastify.register(require('./app'), {
    prefix: '/app'
  })
}
