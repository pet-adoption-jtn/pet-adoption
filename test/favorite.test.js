const { afterAll, beforeAll, it, expect, describe } = require('@jest/globals')
const { signToken } = require('../helpers/jwt')
const request = require('supertest')
const { MongoClient, ObjectID } = require('mongodb')
const app = require('../app')

let access_token = ''
let newDataPet = {}
let db;
let connection;
let FavPets;
let CollUser;
let UserLogin;
const user_data = {
  username: 'user',
  email: 'user@mail.com',
  password: '123456'
}

beforeAll(async () => {
  connection = await MongoClient.connect('mongodb://localhost:27017', {
    useUnifiedTopology: true
  })
  db = await connection.db('favorites-test')
  FavPets = db.collection('favPets-test')
  CollUser = db.collection('Users')
  UserLogin = await CollUser.insertOne(user_data)
  newDataPet = await FavPets.insertOne({
    name: 'kenedi',
    breed: 'wolf',
    age: 'baby',
    gender: 'male',
    color: 'black'
  })
  access_token = signToken(user_data)
})

afterAll(async () => {
  access_token = null
  await FavPets.deleteMany({})
  await CollUser.deleteMany({})
})

describe('add Favorites pet test', () => {
  it('add favorites pet success', (done) => {
    const newPet = {
      name: 'jon',
      breed: 'wolf',
      age: 'baby',
      gender: 'male',
      color: 'black'
    }
    request(app)
      .post('/favorites')
      .set('access_token', access_token)
      .send(newPet)
      .then((res) => {
        const { body, status } = res

        expect(status).toEqual(200)
        expect(body).toHaveProperty('name', 'jon')
        expect(body).toHaveProperty('breed', 'wolf')
        expect(body).toHaveProperty('age', 'baby')
        expect(body).toHaveProperty('gender', 'male')
        expect(body).toHaveProperty('color', 'black')

        done()
      })
      .catch(done)
  })

  it('add favorites pet fail (access_token)', (done) => {
    const newPet = {
      name: 'jon',
      breed: 'wolf',
      age: 'baby',
      gender: 'male',
      color: 'black'
    }
    request(app)
      .post('/favorites')
      .set('access_token', null)
      .send(newPet)
      .then((res) => {
        const { body, status } = res
        expect(status).toEqual(500)
        expect(body).toHaveProperty('message', 'jwt malformed')
        done()
      })
      .catch(done)
  })

  it('add favorites pet fail (no data)', (done) => {
    request(app)
      .post('/favorites')
      .set('access_token', access_token)
      .send(null)
      .then((res) => {
        const { body, status } = res
        expect(status).toEqual(400)
        expect(body).toHaveProperty('message', 'Empty Data')
        console.log( body, '<<<< BODY', status, '<<<< STATUS')
        done()
      })
      .catch(done)
  })

  it('get all Favorites pet success', (done) => {
    request(app)
      .get('/favorites')
      .set('access_token', access_token)
      .then((res) => {
        const { body, status } = res

        expect(status).toEqual(200)
        expect(body).toStrictEqual(expect.any(Array))
        done()
      })
      .catch(done)
  })

  it('delete favorite pet user success', (done) => {
    request(app)
      .delete(`/favorites/${newDataPet.ops[0]._id}`)
      .set('access_token', access_token)
      .then((res) => {
        const { body, status } = res
        expect(status).toEqual(200)
        expect(body).toHaveProperty('msg', 'Successfully deleted one Pet Favorites.')
        done()
      })
      .catch(done)
  })
})