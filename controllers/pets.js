const { db } = require('../config/mongo')
const { ObjectID } = require('mongodb')
const { sendMail, generateMessage } = require('../helpers/nodemailer')

const pets = db.collection('Pets')

class PetController {
  static async readAll (req, res, next) {
    try {
      const petlist = await pets.aggregate([
        {
          $lookup: {
            from: 'Users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'Owner'
          }
        },
        {
          $unwind: {
            path: '$Owner'
          }
        }
      ]).toArray()
      res.status(200).json(petlist)

    } catch (error) {
      next(error)
    }
  }

  static async getOnePet (req, res, next) {
    try {
      const id = req.params.id
      const pet = await pets.aggregate([
        {
          $match: {
            _id: ObjectID(id)
          }
        },
        {
          $lookup: {
            from: 'Users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'Owner'
          }
        },
        {
          $unwind: {
            path: '$Owner'
          }
        }
      ]).toArray()
      if (pet.length > 0) {
        res.status(200).json(pet[0])
      } else {
        throw { status: 404, message: 'Pet is not found' }
      }
    } catch (error) {
      next(error)
    }
  }

  static async filterPets (req, res, next) {
    try {
      const { type, age, gender, color } = req.params
      const filterOptions = {}
      if (type !== '-') {
        filterOptions.type = type
      }
      if (age !== '-') {
        filterOptions.age = age
      }
      if (gender !== '-') {
        filterOptions.gender = gender
      }
      if (color !== '-') {
        filterOptions.color = color
      }
      const filteredPets = await pets.find(filterOptions).toArray()
      res.status(200).json(filteredPets)
    } catch (error) {
      next(error)
    }
  }

  static async addPet (req, res, next) {
    try {
      const user = req.userLoggedIn
      const payload = { 
        name: req.body.name,
        breed: req.body.breed,
        age: req.body.age,
        gender: req.body.gender,
        color: req.body.color,
        type: req.body.type,
        status: false,
        request: false,
        pictures: req.body.pictures,
        user_id: ObjectID(user._id)
      }
      const result = await pets.insertOne(payload)
      if (result.insertedCount !== 1) {
        throw { message: 'Insert Pet Failed', status: 400 }
      } else {
        res.status(201).json(result.ops[0])
      }
    } catch (error) {
      next(error)
    }
  }

  static async requestAdoption(req, res, next) {
    try {
      const { pet_detail, form_data } = req.body
      const updateRequest = await pets.findOneAndUpdate({
        "_id": ObjectID(pet_detail._id)
      }, {
        $set: {
          request: true
        }
      }, {
        returnOriginal: false
      })
      if (updateRequest.value.name) {
        const message = generateMessage(form_data)
        sendMail({
          recipient: pet_detail.Owner.email, 
          subject: `Adoption Request for ${pet_detail.name}`, 
          message
        })
        res.status(200).json({ message: 'Adoption form delivered to owner', pet: updateRequest.value })
      } else {
        res.status(404).json({ message: 'Pet Not Found' })
      }
    } catch (error) {
      next(error)
    }
  }

  static async getPetByOwner(req, res, next) {
    try {
      const user_id = req.userLoggedIn._id
      const pet_owned = await pets.find({
        user_id: ObjectID(user_id)
      }).toArray()
      res.status(200).json(pet_owned)
    } catch (error) {
      next(error)
    }
  }

  static async updatePet(req, res, next) {
    try {
      const id = req.params.id
      const payload = { 
        name: req.body.name,
        breed: req.body.breed,
        age: req.body.age,
        gender: req.body.gender,
        color: req.body.color,
        type: req.body.type
      }
      const result = await pets.findOneAndUpdate({
        "_id": ObjectID(id)
      }, {
        $set: payload
      }, {
        returnOriginal: false
      })
      if (result.value) {
        res.status(200).json(result.value)
      } else {
        throw { message: 'Update failed', status: 400 }
      }
    } catch (error) {
      next(error)
    }
  }

  static async adoptPet (req, res, next) {
    try {
      const id = req.params.id
      const result = await pets.findOneAndUpdate({
        "_id": ObjectID(id)
      }, {
        $set: { status: req.body.status }
      }, {
        returnOriginal: false
      })
      if (result.value.status === true) {
        res.status(200).json({ message: 'Adoption Successfull', data: result.value })
      } else {
        throw { message: 'Adoption Canceled', status: 200, data: result.value }
      }
    } catch (error) {
      next(error)
    }
  }

  static async deletePet (req, res, next) {
    try {
      const id = req.params.id
      const result = await pets.deleteOne({
        "_id": ObjectID(id)
      })
      if (result.deletedCount === 1) {
        res.status(200).json({ message: 'Successfully delete pet' })
      } else {
        throw { message: 'Pet is not found', status: 404 }
      }
    } catch (error) {
      next(error)
    }
  }
} 

module.exports = PetController