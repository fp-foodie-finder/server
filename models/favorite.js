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
        $sort: {
          createdAt: -1,
        },
      },
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
      {
        $project: {
          "user.password": 0,
        },
      },
    ];
    const cursor = this.favoriteCollection().aggregate(agg);
    const result = await cursor.toArray();

    return result;
  }

  static async deleteFavorite(id) {
    const result = await this.favoriteCollection().deleteOne({
      _id: new ObjectId(String(id)),
    });

    return result;
  }
}

module.exports = Favorite;
