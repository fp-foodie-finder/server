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
      {
        $project: {
          "author.password": 0, 
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

  static async updateUnlike(id, payload) {
    const post = await this.postCollection().updateOne(
      { _id: new ObjectId(String(id)) },
      { $pull: payload }
    );
    return post
  }

  static async deletePost(id) {
    const post = await this.postCollection().deleteOne({
      _id: new ObjectId(String(id))
    });

    return post;
  }
}

module.exports = Post;
