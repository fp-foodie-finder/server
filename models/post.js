const { database } = require("../config/mongo");
const { ObjectId } = require("mongodb");

class Post {
  static postCollection() {
    return database.collection("posts");
  }

  static async createOne(payload) {
    const newPost = await this.postCollection().insertOne(payload);
    return newPost;
  }

  static async findAll() {
    const agg = [
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: {
          path: "$author",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    const cursor = this.postCollection().aggregate(agg);
    const result = await cursor.toArray();

    return result;
  }

  static async updateOne(id, payload) {
    const post = await this.postCollection().updateOne(
      { _id: new ObjectId(String(id)) },
      { $push: payload }
    );
    return post
  }
}

module.exports = Post;
