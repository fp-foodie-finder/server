const { database } = require("../config/mongo");
const { ObjectId } = require("mongodb");

class Favorite {
  static favoriteCollection() {
    return database.collection("favorites");
  }

  static async addFavorite(payload) {
    const newFavorite = await this.favoriteCollection().insertOne(payload);
    return newFavorite;
  }

  static async listFavorite(userId) {
    const agg = [
      {
        $match: {
          userId: new ObjectId(String(userId)),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];
    const cursor = this.favoriteCollection().aggregate(agg);
    const result = await cursor.toArray();

    return result;
  }
}

module.exports = Favorite;