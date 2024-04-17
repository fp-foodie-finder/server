const { ObjectId } = require("mongodb");
const { database } = require("../config/mongo");

class User {
  static userCollection() {
    return database.collection("users");
  }

  static async findById(id) {
    const user = await this.userCollection().findOne({
      _id: new ObjectId(String(id)),
    });
    return user;
  }

  static async createOne(payload) {
    const newUser = await this.userCollection().insertOne(payload);
    return newUser;
  }

  static async findByEmail(email) {
    const user = await this.userCollection().findOne({
      email: email
    });
    return user;
  }
}

module.exports = User;