const multer = require('fastify-multer')
const upload = multer()

module.exports = async (fastify) => {

  fastify.get('/login', async (request, reply) => {
    reply.view('auth/login')
  })

  fastify.post('/login', {
    preHandler: upload.none(),
    handler: async (request, reply) => {
      const data = request.body
      const { username, password } = data
      reply.redirect('/app')
    }
  })

}