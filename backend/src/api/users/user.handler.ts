import { Request, Response, NextFunction } from 'express'
import { ObjectId } from 'mongodb'
import { ParamsWithId } from '../../interfaces/ParamsWithId'
import bcrypt from 'bcrypt'
import { Users, User, UserWithId } from './user.model'
import DataResponse from '../../interfaces/DataResponse'

export async function findAll(
  req: Request,
  res: Response<DataResponse<object>>,
  next: NextFunction
) {
  try {
    const users = await Users.find({ select: '-password -token' }).toArray()

    res.status(200).json({ data: users, message: 'OK' })
  } catch (error) {
    next(error)
  }
}

export async function findOne(
  req: Request<ParamsWithId, UserWithId, {}>,
  res: Response<DataResponse<UserWithId>>,
  next: NextFunction
) {
  try {
    const user = await Users.findOne({
      _id: new ObjectId(req.params.id),
      select: '-password -token',
    })

    if (!user) {
      res.status(404)
      throw new Error(`User with id "${req.params.id}" not found.`)
    }
    res.status(200).json({ data: user, message: 'OK' })
  } catch (error) {
    next(error)
  }
}

export async function createOne(
  req: Request<{}, UserWithId, User>,
  res: Response<DataResponse<UserWithId>>,
  next: NextFunction
) {
  try {
    const password = await bcrypt.hash(req.body.password, 10)
    const insertUser = {
      ...req.body,
      password,
    }
    const insertResult = await Users.insertOne(insertUser)
    if (!insertResult.acknowledged) throw new Error('Error inserting user.')

    const user = {
      _id: insertResult.insertedId,
      ...req.body,
    }

    res.status(201).json({ data: user, message: 'OK' })
  } catch (error) {
    console.log(error)
    next(error)
  }
}

export async function updateOne(
  req: Request<ParamsWithId, UserWithId, User>,
  res: Response<DataResponse<UserWithId>>,
  next: NextFunction
) {
  try {
    const result = await Users.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      {
        $set: req.body,
      },
      { projection: { password: 0, token: 0 }, returnDocument: 'after' }
    )
    if (!result.value) {
      res.status(404)
      throw new Error(`User with id "${req.params.id}" not found`)
    }

    res.status(200).json({ data: result.value, message: 'OK' })
  } catch (error) {
    next(error)
  }
}

export async function deleteOne(
  req: Request<ParamsWithId>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await Users.findOneAndDelete({ _id: new ObjectId(req.params.id) })
    if (!result.value) {
      res.status(404)
      throw new Error(`User with id "${req.params.id}" not found`)
    }

    res.status(204).end()
  } catch (error) {
    next(error)
  }
}
