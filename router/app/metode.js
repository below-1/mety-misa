const multer = require('fastify-multer')
const upload = multer()
const _ = require('lodash')

function wp({ xs, weights }) {
  const totalWeights = weights.reduce((a, b) => a + b, 0)
    const normedWeights = weights.map(w => w / totalWeights)

    const result = xs
      .map(row => {
        // console.log(row.data.map((x, j) => Math.pow(x, weights[j])))
        return row.data
          .map((x, j) => Math.pow(x, normedWeights[j]))
          .reduce((a, b) => a * b, 1)
      })
    const packedResult = result.map((r, i) => {
      return {
        nama: xs[i].nama,
        value: r
      }
    })
    const totalV = packedResult.map(r => r.value).reduce((a, b) => a + b, 0)
    const withV = result.map((r, i) => {
      return {
        _id: xs[i]._id,
        nama: xs[i].nama,
        v: r / totalV
      }
    })

    const rank = _.sortBy(withV, (r) => r.v).reverse()
    return rank
}

function compareResult(xs1, xs2) {
  return xs1.map((xi, i) => {
    const xj = xs2[i]
    if (xi._id != xj._id) {
      return 1
    }
    return 0
  }).reduce((a, b) => a + b, 0)
}

function singleSensitivitas({ xs, weights, icriteria }) {
  const oriResult = wp({ xs, weights })
  let updatedWeights = [ ...weights ]
  updatedWeights[icriteria] += 0.5
  const n = oriResult.length
  const modResult = wp({ xs, weights: updatedWeights })
  const result = oriResult.map((xi, i) => {
    const xj = modResult[i]
    const newPos = modResult.findIndex(_x => _x._id == xi._id)
    let item = { ...xi }
    if (xi._id != xj._id) {
      item = {
        ...item,
        change: true,
        newPos
      }
    }
    return item
  })
  return result
}

function sensitivitas({ xs, weights }) {
  const oriResult = wp({ xs, weights })
  const n = oriResult.length
  const results = []
  for (let i = 0; i < 5; i++) {
    let updatedWeights = [ ...weights ]
    updatedWeights[i] += 0.5
    const modResult = wp({ xs, weights: updatedWeights })
    const diffs = compareResult(oriResult, modResult)
    results.push(diffs / n * 100)
  }
  return results
}

module.exports = async (fastify) => {
  

  fastify.get('/rank', async (request, reply) => {
    const weights = await fastify.mongo.db.collection('bobot').findOne({})
    const xs = await fastify.mongo.db.collection('dosen').find({}).toArray()
    const result = wp({ xs, weights: weights.data })
    reply.view('app/rank', {
      items: result
    })
  })

  fastify.get('/sensitivitas', async (request, reply) => {
    const weights = await fastify.mongo.db.collection('bobot').findOne({})
    const xs = await fastify.mongo.db.collection('dosen').find({}).toArray()
    const result = sensitivitas({ weights: weights.data, xs })
    const criteria = [
      'pendidikan dan pengajaran',
      'penelititan',
      'pengabdian pada masyrakat',
      'penilaian mahasiswa',
      'penilaian atasan'
    ]
    const diffs = result.map((x, i) => ({
      c: criteria[i],
      v: x
    }))
    reply.view('app/sensitivitas', {
      diffs
    })
  })

  fastify.get('/sensitivitas/:icriteria', async (request, reply) => {
    const weights = await fastify.mongo.db.collection('bobot').findOne({})
    const xs = await fastify.mongo.db.collection('dosen').find({}).toArray()
    const icriteria = parseInt(request.params.icriteria)
    const result = singleSensitivitas({ xs, weights: weights.data, icriteria })
    reply.view('app/sensitivitas-detail',{ result })
  })
}
