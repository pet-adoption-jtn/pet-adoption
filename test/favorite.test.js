const { afterAll, beforeAll, it, expect, describe } = require('@jest/globals')
const { signToken } = require('../helpers/jwt')
const { db, ObjectID } = require('../config/mongo')
const { hashPassword } = require('../helpers/bcrypt')
const request = require('supertest')
const app = require('../app')

let access_token = ''
let newDataPet = {}
let FavPets;
let CollUser;
let UserLogin;
let InsertPet;
let CollPet;
let petData;

const user_data = {
  email: 'example@mail.com',
  password: hashPassword('123456'),
  phone: '081905056936',
  address: 'jakarta',
  username: 'examspl'
}

beforeAll(async () => {
  FavPets = db.collection('Favorites')
  CollUser = db.collection('Users')
  CollPet = db.collection('Pets')
  UserLogin = await CollUser.insertOne(user_data)
  InsertPet = await CollPet.insertOne({
    name: 'Kora',
    breed: 'Alaskan Malamute',
    age: 'baby',
    gender: 'male',
    color: 'white',
    type: 'dog',
    status: false,
    request: [],
    pictures: [
      'https://upload.wikimedia.org/wikipedia/commons/9/9f/Alaskan_Malamute.jpg',
      'https://s3.amazonaws.com/cdn-origin-etr.akc.org/wp-content/uploads/2017/11/14141551/Alaskan-Malamute-puppies.jpg'
    ],
    user_id: ObjectID(UserLogin.ops[0]._id)
  })
  petData = await CollPet.insertOne({
    name: 'Bumi',
    breed: 'Alaskan Malamute',
    age: 'baby',
    gender: 'male',
    color: 'white',
    type: 'dog',
    status: false,
    request: [],
    pictures: [
      'https://upload.wikimedia.org/wikipedia/commons/9/9f/Alaskan_Malamute.jpg',
      'https://s3.amazonaws.com/cdn-origin-etr.akc.org/wp-content/uploads/2017/11/14141551/Alaskan-Malamute-puppies.jpg'
    ],
    user_id: ObjectID(UserLogin.ops[0]._id)
  })
  newDataPet = await FavPets.insertOne({
    pet_id: ObjectID(InsertPet.ops[0]._id),
    user_id: ObjectID(UserLogin.ops[0]._id)
  })
  access_token = signToken(user_data)
})

afterAll(async () => {
  access_token = ''
  await FavPets.deleteMany({})
  await CollPet.deleteMany({})
  await CollUser.deleteMany({})
})

describe('add Favorites pet test', () => {
  it('add favorites pet success', (done) => {
    const newPet = {
      pet_id: petData.ops[0]._id
    }
    request(app)
      .post('/favorites')
      .set('access_token', access_token)
      .send(newPet)
      .then((res) => {
        const { body, status } = res

        expect(status).toEqual(200)
        expect(body).toHaveProperty('pet_id', expect.any(String))
        expect(body).toHaveProperty('user_id', expect.any(String))

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
        done()
      })
      .catch(done)
  })

  it('add favorites pet fail (copy)', (done) => {
    request(app)
      .post('/favorites')
      .set('access_token', access_token)
      .send({
        pet_id: InsertPet.ops[0]._id
      })
      .then(res => {
        const { status, body } = res
        expect(status).toEqual(400)
        expect(body).toHaveProperty('message', 'Already in favorites')
        done()
      })
      .catch(done)
  })
})

describe('get favorites test', () => {
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
})

describe('delete favorites test', () => {
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
  it('delete favorite failed (id not found)', (done) => {
    request(app)
      .delete(`/favorites/5fd08ff84860bd089c5c5369`)
      .set('access_token', access_token)
      .then(res => {
        const { body, status } = res
        expect(status).toEqual(404)
        expect(body).toHaveProperty('message', 'No documents matched the query. Deleted 0 documents.')
        done()
      })
      .catch(done)
  })
})