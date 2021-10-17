const path = require('path')
const multer = require('fastify-multer')

const fastify = require('fastify')({
  logger: process.env.NODE_ENV == 'development'
})

fastify.register(require('fastify-blipp'))
fastify.register(require('fastify-static'), {
  root: path.join(__dirname, 'static'),
  prefix: '/static'
})
fastify.register(multer.contentParser)
fastify.register(require('fastify-mongodb'), {
  forceClose: true,
  url: process.env.MONGODB_URI
})
fastify.register(require('point-of-view'), {
  engine: {
    nunjucks: require('nunjucks')
  },
  root: path.join(__dirname, 'views'),
  viewExt: 'html'
})
fastify.register(require('fastify-cookie'))
fastify.register(require('fastify-session'), { secret: process.env.SESSION_SECRET, cookie: { secure: false } })
fastify.register(require('./router'))

fastify.listen(process.env.PORT, (err, address) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }
  fastify.blipp()
  console.log(`listening at ${address}`)
})
