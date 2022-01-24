const _ = require('lodash')

module.exports = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    reply.view('app/base')
  })

  fastify.get('/test', async (request, reply) => {
    const XS = [
      {
        name: 'adriana fanggidae',
        data: [17, 1, 2, 90.4, 85.39],
      },
      // {
      //   name: 'arfan',
      //   data: [8, 1, 2, , 90.45, 84.34],
      // },
      // {
      //   name: 'bertha',
      //   data: [12.5, 1, 2, , 85.21, 85.56],
      // },
      {
        name: 'derwin',
        data: [19.5, 1, 2, 85.11, 84.19],
      },
      // {
      //   name: 'dony',
      //   data: [9, 1, 2, 85.35, 84.66],
      // },
      {
        name: 'esy',
        data: [12.5, 1, 2, 74.51, 85.15],
      },
      // {
      //   name: 'kornelis',
      //   data: [19.5, 1, 2, 80.45, 83.33],
      // },
      {
        name: 'meiton',
        data: [13, 1, 2, 80.2, 81.81],
      },
      // {
      //   name: 'desi',
      //   data: [17.5, 1, 2, 84.9, 80.63],
      // },
      {
        name: 'adi',
        data: [19, 1, 2, 90.4, 85.71],
      },
      // {
      //   name: 'tiwuk',
      //   data: [18, 1, 2, 85.16, 85.8],
      // },
      // {
      //   name: 'yelly',
      //   data: [17.5, 1, 2, 82.6, 85.71],
      // }
    ]

    const weights = [0.2, 0.3, 0.3, 0.15, 0.15]
    const totalWeights = weights.reduce((a, b) => a + b, 0)
    const normedWeights = weights.map(w => w / totalWeights)

    const result = XS
      .map(row => {
        // console.log(row.data.map((x, j) => Math.pow(x, weights[j])))
        return row.data
          .map((x, j) => Math.pow(x, normedWeights[j]))
          .reduce((a, b) => a * b, 1)
      })
    const packedResult = result.map((r, i) => {
      return {
        name: XS[i].name,
        value: r
      }
    })
    const totalV = packedResult.map(r => r.value).reduce((a, b) => a + b, 0)
    const withV = result.map((r, i) => {
      return {
        name: XS[i].name,
        v: r / totalV
      }
    })

    const rank = _.sortBy(withV, (r) => r.v).reverse()

    console.log(rank)
    // console.log(normedWeights)
    reply.send('OK')
  })

  fastify.register(require('./dosen'), {
    prefix: 'dosen'
  })
  fastify.register(require('./bobot'), {
    prefix: 'bobot'
  })
  fastify.register(require('./metode'), {
    prefix: 'wp'
  })
  fastify.register(require('./periode'), {
    prefix: 'periode'
  })
}
