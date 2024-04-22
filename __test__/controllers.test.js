const request = require("supertest");
const app = require("../app");
const User = require("../models/user");
const Post = require("../models/post");
const Favorite = require("../models/favorite");
const { database } = require("../config/mongo");
const redis = require("../config/redis");
const { hashPassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const axios = require("axios");

jest.mock("axios");

let token;
let id;

beforeAll(async () => {
  const user = {
    fullname: "Test User",
    email: "testuser@example.com",
    password: hashPassword("testpassword"),
    username: "testuser",
    preference: "test preference",
  };
  const test = await database.collection("users").insertOne(user);
  token = signToken({ id: test.insertedId });

  const post = {
    imageUrl: "http://example.com/test.jpg",
    description: "This is a test post",
    authorId: test.insertedId,
  };
  id = await database.collection("posts").insertOne(post);
  id = String(id.insertedId);
});

afterAll(async () => {
  await Promise.all([
    database.collection("users").deleteMany({}),
    database.collection("posts").deleteMany({}),
    database.collection("favorites").deleteMany({}),
    redis.quit(),
  ]);
});

describe("Controllers", () => {
  describe("Home", () => {
    it("should return a welcome message", async () => {
      const response = await request(app).get("/");
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Welcome to our api");
    });
  });

  describe("Register", () => {
    it("should create a new user", async () => {
      const mockRequest = {
        fullname: "John Doe",
        email: "john@example.com",
        password: "password",
        username: "johndoe",
        preference: "test preference",
      };

      const response = await request(app).post("/register").send(mockRequest);
      expect(response.status).toBe(201);
      expect(response.body.message).toBe("user created");
    });
  });

  describe("Login", () => {
    it("should login a user", async () => {
      const response = await request(app).post("/login").send({
        email: "testuser@example.com",
        password: "testpassword",
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("login success");
    });
  });

  describe("Post", () => {
    it("should create a new post", async () => {
      const mockRequest = {
        imageUrl: "http://example.com/test.jpg",
        description: "This is a test post",
      };

      const response = await request(app)
        .post("/post")
        .set("Authorization", `Bearer ${token}`)
        .send(mockRequest);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Post created");
      expect(response.body.newPost.imageUrl).toBe(mockRequest.imageUrl);
      expect(response.body.newPost.description).toBe(mockRequest.description);
    });

    it("Invalid Token", async () => {
      const mockRequest = {
        imageUrl: "http://example.com/test.jpg",
        description: "This is a test post",
      };

      const response = await request(app)
        .post("/post")
        .set("Authorization", `Bearer asd`)
        .send(mockRequest);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid Token");
    });

    it("Invalid Token 2", async () => {
      const mockRequest = {
        imageUrl: "http://example.com/test.jpg",
        description: "This is a test post",
      };

      const response = await request(app).post("/post").send(mockRequest);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid Token");
    });

    it("Invalid Token 3", async () => {
      const mockRequest = {
        imageUrl: "http://example.com/test.jpg",
        description: "This is a test post",
      };

      const response = await request(app)
        .post("/post")
        .set("Authorization", `asd asd`)
        .send(mockRequest);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid Token");
    });

    it("should not create a post if imageUrl is missing", async () => {
      const mockRequest = {
        description: "This is a test post",
      };

      const response = await request(app)
        .post("/post")
        .set("Authorization", `Bearer ${token}`)
        .send(mockRequest);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Image URL is required");
    });

    it("should not create a post if description is missing", async () => {
      const mockRequest = {
        imageUrl: "http://example.com/test.jpg",
      };

      const response = await request(app)
        .post("/post")
        .set("Authorization", `Bearer ${token}`)
        .send(mockRequest);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Description is required");
    });
  });

  describe("Post", () => {
    it("should list all posts", async () => {
      const response = await request(app)
        .get("/post")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("Post", () => {
    it("should like a post", async () => {
      const postId = id;
      const response = await request(app)
        .put(`/like/${postId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Post liked");
    });

    it("should unlike a post", async () => {
      const postId = id;
      const response = await request(app)
        .put(`/unlike/${postId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Post unliked");
    });

    it("should dislike a post", async () => {
      const postId = id;
      const response = await request(app)
        .put(`/dislike/${postId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Post disliked");
    });
  });

  describe("Error Handling", () => {
    describe("FullNameRequired", () => {
      it("should return 400 if fullname is missing", async () => {
        const mockRequest = {
          email: "john@example.com",
          password: "password",
          username: "johndoe",
          preference: "test preference",
        };
        const response = await request(app).post("/register").send(mockRequest);
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Full name is required");
      });
    });

    describe("UsernameRequired", () => {
      it("should return 400 if username is missing", async () => {
        const mockRequest = {
          fullname: "John Doe",
          email: "john@example.com",
          password: "password",
          preference: "test preference",
        };
        const response = await request(app).post("/register").send(mockRequest);
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Username is required");
      });
    });

    describe("EmailRequired", () => {
      it("should return 400 if email is missing", async () => {
        const mockRequest = {
          fullname: "John Doe",
          password: "password",
          username: "johndoe",
          preference: "test preference",
        };
        const response = await request(app).post("/register").send(mockRequest);
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Email is required");
      });
    });

    describe("PassRequired", () => {
      it("should return 400 if password is missing", async () => {
        const mockRequest = {
          fullname: "John Doe",
          email: "john@example.com",
          username: "johndoe",
          preference: "test preference",
        };
        const response = await request(app).post("/register").send(mockRequest);
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Password is required");
      });
    });

    describe("FormatEmail", () => {
      it("should return 400 if email format is invalid", async () => {
        const mockRequest = {
          fullname: "John Doe",
          email: "invalid-email",
          password: "password",
          username: "johndoe",
          preference: "test preference",
        };
        const response = await request(app).post("/register").send(mockRequest);
        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
          "Email must be formatted (example@gmail.com)"
        );
      });
    });

    describe("ExistEmail", () => {
      it("should return 400 if email already exists", async () => {
        const mockRequest = {
          fullname: "John Doe",
          email: "testuser@example.com",
          password: "password",
          username: "johndoe",
          preference: "test preference",
        };
        const response = await request(app).post("/register").send(mockRequest);
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Email already exists");
      });
    });
  });
});

describe("Maps Controller", () => {
  it("should return map data from the Google Maps API", async () => {
    const mockData = {
      data: {
        places: [
          {
            displayName: "Test Place",
            formattedAddress: "123 Test Street, Test City",
            priceLevel: 2,
            googleMapsUri: "https://example.com/test-place",
            photos: [{ name: "test-photo.jpg" }],
            rating: 4.5,
          },
        ],
      },
    };

    axios.request.mockResolvedValueOnce(mockData);

    const textQuery = "Test Query";
    const response = await request(app)
      .post("/maps")
      .send({ textQuery })
      .expect(200);

    expect(response.body.data).toEqual(mockData.data);
    expect(axios.request).toHaveBeenCalledWith({
      method: "POST",
      url: "https://places.googleapis.com/v1/places:searchText",
      headers: {
        "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.priceLevel,places.googleMapsUri,places.photos,places.rating",
      },
      data: { textQuery },
    });
  });
});

describe("AI Controller", () => {
  it("should return AI response from the OpenAI API", async () => {
    const mockData = {
      data: {
        result: "This is a test AI response.",
      },
    };

    axios.request.mockResolvedValueOnce(mockData);

    const input = "Test input";
    const response = await request(app).post("/ai").send({ input }).expect(200);

    expect(response.body.result).toEqual(mockData.data.result);
    expect(axios.request).toHaveBeenCalledWith({
      method: "POST",
      url: "https://open-ai21.p.rapidapi.com/conversationgpt35",
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": process.env.AI_KEY,
        "X-RapidAPI-Host": process.env.AI_HOST,
      },
      data: {
        messages: [{ role: "user", content: input }],
        web_access: false,
        system_prompt: "",
        temperature: 0.9,
        top_k: 5,
        top_p: 0.9,
        max_tokens: 256,
      },
    });
  });
});
