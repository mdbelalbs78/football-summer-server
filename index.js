const express = require('express')
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middleware 
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dtiuxwh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const usersCollection = client.db("footballDb").collection("users");
    const classCollection = client.db("footballDb").collection("class")
    const instructorCollection = client.db("footballDb").collection("instructor")
    const addClassCollection = client.db("footballDb").collection("addClassCollection")
    const selectedCollection = client.db('footballDb').collection('selected');


    // get all class
    app.get('/allclass', async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    })

    // addClass 

    app.post('/addclass', async (req, res) => {
      const addClass = req.body;
      const result = await addClassCollection.insertOne(addClass);
      res.send(result);
    })

    // addclass/feedback

    app.patch("/addclass/feedback/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          feedData: req.body.feedData
        },
      };
      const result = await addClassCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // class
    app.get('/class', async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    })
    app.get('/classes/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await classCollection.findOne(query)
      res.send(result)
    })

    app.patch("/classesUpdate/:id", async (req, res) => {
      const id = req.params.id;
      const cursor = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          className: cursor.className,
          price: cursor.price,
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.post('/classes', async (req, res) => {
      const user = req.body;
      const result = await classCollection.insertOne(user);
      res.send(result);
    })
 
    app.delete('/classes/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await classCollection.deleteOne(query)
      res.send(result)
    })

    app.get("/instructorClasses/:email", async (req, res) => {
      const email = req.params.email;
      const query = { instructorEmail: email };
      const result = await classCollection.find(query).toArray();
      res.send(result);
    });

    // instructor 
    app.get('/instructor', async (req, res) => {
      const result = await instructorCollection.find().toArray();
      res.send(result);
    })

    app.post('/instructor', async (req, res) => {
      const user = req.body;
      const result = await instructorCollection.insertOne(user);
      res.send(result);
    })

     // approved classes
     app.patch("/classes/approved/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Deny classes
    app.patch("/classes/deny/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "deny",
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // feedback classes
    app.patch("/classes/feedback/:id", async (req, res) => {
      const id = req.params.id;
      const query = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          feedback: query,
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // selected
    app.get('/selectedClassData', async (req, res) => {
      
      const result = await selectedCollection.find().toArray();
      res.send(result);
    })

    app.post('/selectedClassData', async (req, res) => {
      const user = req.body;
      const result = await selectedCollection.insertOne(user);
      res.send(result);
    })
    
    app.get('/selectedClassData/:email', async (req, res) => {
      const email = req.params.email;
      const query = {userEmail: email};
      const result = await selectedCollection.find(query).toArray()
      res.send(result);
    })

    // user
    app.get('/users', async(req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.send({ token })
    })

    const verifyAdmin = async(req, res, next)=>{
      const email = req.decoded.email;
        const query = {email: email};
        const user = await usersCollection.findOne(query)
        if(user?.role !== 'admin'){
          return res.status(403).send({error: true, message: 'forbidden message'});
        }
        next();
    }
    
    app.get('/dashboard/:email', async (req, res) => {
      const email = req.params.email;
      console.log('dashbord',email);
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      res.send(user)
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = {email: user.email}
      const existingUser = await usersCollection.findOne(query)
      console.log('existing user',existingUser);

      if(existingUser){
        return res.send({message: 'user already exists'})
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })

    app.get('/users/admin/:email', verifyJWT, async(req, res) =>{
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = {email: email}
      const user = await usersCollection.findOne(query)
      const result = {admin: user?.role === 'admin'}
      res.send(result)
    })

    app.patch('/users/admin/:id', async(req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
    app.get('/users/admin/:email', verifyJWT, async(req, res) =>{
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = {email: email}
      const user = await usersCollection.findOne(query)
      const result = {admin: user?.role === 'admin'}
      res.send(result)
    })

    app.patch('/users/admin/:id', async(req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })


    app.get('/users/instructor/:email', verifyJWT, async(req, res) =>{
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ instructor: false })
      }

      const query = {email: email}
      const user = await usersCollection.findOne(query)
      const result = {instructor: user?.role === 'instructor'}
      res.send(result)
    })

    app.patch('/users/instructor/:id', async(req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log(`football academy server is running on port ${port}`);
})