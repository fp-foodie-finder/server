const { database } = require("../config/mongo");

class Favorite {
  static favoriteCollection() {
    return database.collection("favorites");
  }

  static async addFavorite(payload) {
    const newFavorite = await this.favoriteCollection().insertOne(payload);
    return newFavorite;
  }
}

module.exports = Favorite;