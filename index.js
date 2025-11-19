const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const admin = require("firebase-admin");
const serviceAccount = require("./serviceKey.json");

require("dotenv").config();
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@algo-nova.ntsxvj0.mongodb.net/?appName=Algo-Nova`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyTocane = async (req, res, next) => {
  const authorizationToken = req.headers.authorization;

  if (!authorizationToken) {
    res.status(401).send("Unauthorized Token");
    return;
  }
  const token = authorizationToken.split(" ")[1];

  try {
    await admin.auth().verifyIdToken(token);
    next();
  } catch (errror) {
    res.status(401).send("Unauthorized Token");
  }
};

async function run() {
  try {
    await client.connect();

    const db = client.db("foods-db");
    const FoodsReviewCollection = db.collection("foods-reviews");
    const FavoriteReviewCollection = db.collection("Favorite");

    app.get("/food-reviews", async (req, res) => {
      try {
        const result = await FoodsReviewCollection.find()
          .sort({ date: 1 })
          .toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/favorite-reviews", async (req, res) => {
      try {
        const result = await FavoriteReviewCollection.find()
          .sort({ date: 1 })
          .toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/search-reviews", async (req, res) => {
      try {
        const search = req.query.search || "";

        const result = await FoodsReviewCollection.find({
          foodName: { $regex: search, $options: "i" },
        }).toArray();

        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/my-favorite-reviews", verifyTocane, async (req, res) => {
      try {
        const email = req.query.email;

        const result = await FavoriteReviewCollection.find({
          likedBy: email,
        }).toArray();

        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.post("/food-reviews", verifyTocane, async (req, res) => {
      try {
        const data = req.body;
        const result = await FoodsReviewCollection.insertOne(data);
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.post("/favorite-reviews", verifyTocane, async (req, res) => {
      try {
        const data = req.body;
        const result = await FavoriteReviewCollection.insertOne(data);
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/top-food-reviews", async (req, res) => {
      try {
        const result = await FoodsReviewCollection.find()
          .sort({ rating: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/recomended-food", async (req, res) => {
      try {
        const result = await FoodsReviewCollection.find()
          .sort({ rating: -1 })
          .limit(1)
          .toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/food-reviews/:id", verifyTocane, async (req, res) => {
      try {
        const id = req.params.id;
        const result = await FoodsReviewCollection.findOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/my-food-reviews", verifyTocane, async (req, res) => {
      try {
        const email = req.query.email;

        const result = await FoodsReviewCollection.find({
          reviewerEmail: email,
        }).toArray();

        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/food-reviews", async (req, res) => {
      try {
        const email = req.query.email;

        const result = await FavoriteReviewCollection.find({
          likedBy: email,
        }).toArray();

        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.delete("/food-reviews/:id", verifyTocane, async (req, res) => {
      try {
        const reviewId = req.params.id;

        const result = await FoodsReviewCollection.deleteOne({
          _id: new ObjectId(reviewId),
        });

        if (result.deletedCount === 1) {
          res.send({ success: true, message: "Review deleted successfully." });
        } else {
          res
            .status(404)
            .send({ success: false, message: "Review not found." });
        }
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.delete("/favorite-reviews/:id", verifyTocane, async (req, res) => {
      try {
        const reviewId = req.params.id;

        const result = await FavoriteReviewCollection.deleteOne({
          _id: new ObjectId(reviewId),
        });

        if (result.deletedCount === 1) {
          res.send({ success: true, message: "Review deleted successfully." });
        } else {
          res
            .status(404)
            .send({ success: false, message: "Review not found." });
        }
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.put("/food-reviews/:id", verifyTocane, async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;
        const result = FoodsReviewCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        res.send(result);
      } catch {
        res.status(500).send({ error: err.message });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello world");
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
