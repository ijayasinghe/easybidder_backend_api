// importing packages
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// require('dotenv').config();

// setups
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const URL = "mongodb+srv://user1:300363890@cluster0.t7jyf5u.mongodb.net/EasyBidderDB?retryWrites=true&w=majority&appName=Cluster0"
mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        // Start your Express server once connected to MongoDB
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

//---------------------------Item Collection--------------------------
// define Schema Class
const Schema = mongoose.Schema;

// Create a Schema object
const bookSchema = new Schema({
    ItemID: { type: Number, required: true },
    Title: { type: String, required: true },
    ImageURL: { type: String, required: true },
    Description: { type: String, required: true },
    bids: {},
    HighestBid:{ type: Number, required: false }
});

const Item = mongoose.model("Item", bookSchema);

const router = express.Router();

// Mount the router middleware at a specific path
app.use('/api', router);

// app.get('/', (req, res) => {
router.route("/items/")
    .get((req, res) => {
        try {
            Item.find()
                .then((items) => {
                    if (items.length == 0) { 
                        res.json("no item found") 
                    } else { 
                        res.json(items);
                        for(i=0;i<items.length;i++){
                            items[i].HighestBid={$max:"bids"};
                        } 

                    }
                    
                })
        }
        catch (error) {
            // console.error('Error:', error);
            res.status(500).json({ message: error.message });
        }
    });

    router.route("/itemsWithHighestBid/")
    .get(async (req, res) => {
      try {
        // Fetch all items
        const items = await Item.find();
  
        if (items.length === 0) {
          return res.json("No items found");
        }
  
        // Map through items to add highest bid to each item
        const itemsWithHighestBid = await Promise.all(items.map(async (item) => {
          // Find all bids for the current item
          const bids = await Bid.find({ ItemID: item._id });
  
          // Calculate the highest bid amount
          let highestBid = 0;
          if (bids.length > 0) {
            highestBid = Math.max(...bids.map(bid => bid.BidAmount));
          }
  
          // Set the highest bid in the item object
          item.HighestBid = highestBid;
  
          return item;
        }));
  
        res.json(itemsWithHighestBid);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    router.route('/items/:id').get(async (req, res) => {
        try {
          const itemId = req.params.id;
          
          // Fetch item and bids concurrently
          const [item, bids] = await Promise.all([
            Item.findById(itemId),
            Bid.find({ ItemID: itemId })
          ]);
      
          // Check if item is found
          if (!item) {
            return res.json('No record found');
          }
      
          // Set the bids to the item's bids property
          //item.bids = [{ name: 'Alice', bid: 330 }] ;
          item.bids = bids;
      
          // Send the combined response
          res.json(item);
        } catch (error) {
          res.status(500).json({ message: error.message });
        }
      });

router.route("/items/add")
    .post((req, res) => {

        try {
            if (req.body.ItemID == null || req.body.Title == null || req.body.ImageURL == null || req.body.Description == null) {
                res.json("Please submit all the fields for Item Id, title, image url, and description.")
            } else {
                const ItemID = req.body.ItemID;
                const Title = req.body.Title;
                const ImageURL = req.body.ImageURL;
                const Description = req.body.Description;
                // create a new Book object 
                const newItem = new Item({
                    ItemID,
                    Title,
                    ImageURL,
                    Description
                });

                // save the new object (newBook)
                newItem
                    .save()
                    .then(() => res.json("Item added!"))
                    .catch((err) => res.status(400).json("Error: " + err));
            }
        } catch (error) {
            // console.error('Error:', error);
            res.status(500).json({ message: error.message });
        }
    });

router.route("/items/update/:id")
    .put((req, res) => {
        try {
            Item.findById(req.params.id)
                .then((item) => {
                    if (item == null) { res.json("no record found") }
                    else {
                        item.ItemID = req.body.ItemID;
                        item.Title = req.body.Title;
                        item.ImageURL=req.body.ImageURL;
                        item.Description=req.body.Description;

                        item
                            .save()
                            .then(() => res.json("Item updated!"))
                            .catch((err) => res.status(400).json("Error: " + err));
                    }
                })
                .catch((err) => res.status(400).json("Error: " + err));
        } catch (error) {
            // console.error('Error:', error);
            res.status(500).json({ message: error.message });
        }
    });

router.route("/items/delete/:id")
    .delete((req, res) => {
        try {
            Item.findById(req.params.id)
                .then((item) => {
                    if (item == null) { res.json("no record found") }
                    else {
                        Item.findByIdAndDelete(req.params.id)
                            .then(() => {
                                console.log("Item test");
                                res.json("Item deleted.")
                            })
                    }
                })
        }
        catch (error) {
            // console.error('Error:', error);
            res.status(500).json({ message: error.message });
        }

    });


//---------------------------User Collection--------------------------

// define Schema Class
const SchemaUser = mongoose.Schema;

// Create a Schema object
const userSchema = new SchemaUser({
    UserID: { type: Number, required: true },
    Username: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);


// app.get('/', (req, res) => {
router.route("/users/")
    .get((req, res) => {
        try {
            User.find()
                .then((users) => {
                    if (users.length == 0) { res.json("no user found") } else { res.json(users) }
                })
        }
        catch (error) {
            // console.error('Error:', error);
            res.status(500).json({ message: error.message });
        }
    });

router.route("/users/:id")

    .get((req, res) => {
        try {
            User.findById(req.params.id)
                .then((user) => { if (user == null) { res.json("no record found") } else { res.json(user) } })
        }
        catch (error) {
            // console.error('Error:', error);
            res.status(500).json({ message: error.message });
        }
    });

router.route("/users/add")
    .post((req, res) => {

        try {
            if (req.body.UserID == null || req.body.Username == null) {
                res.json("Please submit all the fields for user Id and username.")
            } else {
                const UserID = req.body.UserID;
                const Username = req.body.Username;
                
                // create a new Book object 
                const newUser = new User({
                    UserID,
                    Username
                });

                // save the new object (newBook)
                newUser
                    .save()
                    .then(() => res.json("User added!"))
                    .catch((err) => res.status(400).json("Error: " + err));
            }
        } catch (error) {
            // console.error('Error:', error);
            res.status(500).json({ message: error.message });
        }
    });

router.route("/users/update/:id")
    .put((req, res) => {
        try {
            User.findById(req.params.id)
                .then((user) => {
                    if (user == null) { res.json("no record found") }
                    else {
                        user.UserID = req.body.UserID;
                        user.Username = req.body.Username;
                        
                        user
                            .save()
                            .then(() => res.json("User updated!"))
                            .catch((err) => res.status(400).json("Error: " + err));
                    }
                })
                .catch((err) => res.status(400).json("Error: " + err));
        } catch (error) {
            // console.error('Error:', error);
            res.status(500).json({ message: error.message });
        }
    });

router.route("/users/delete/:id")
    .delete((req, res) => {
        try {
            User.findById(req.params.id)
                .then((user) => {
                    if (user == null) { res.json("no record found") }
                    else {
                        User.findByIdAndDelete(req.params.id)
                            .then(() => {
                                console.log("User test");
                                res.json("User deleted.")
                            })
                    }
                })
        }
        catch (error) {
            // console.error('Error:', error);
            res.status(500).json({ message: error.message });
        }

    });

//---------------------------Bid Collection--------------------------

// define Schema Class
const SchemaBid = mongoose.Schema;

// Create a Schema object
const bidSchema = new SchemaBid({
    BidID: { type: Number, required: true },
    ItemID: { type: String, required: true },
    UserName: { type: String, required: true },
    BidAmount:{type:Number, required:true }
});

const Bid = mongoose.model("Bid", bidSchema);


// app.get('/', (req, res) => {
router.route("/bids/")
    .get((req, res) => {
        try {
            Bid.find()
                .then((bids) => {
                    if (bids.length == 0) { res.json("no bids found") } else { res.json(bids) }
                })
        }
        catch (error) {
            // console.error('Error:', error);
            res.status(500).json({ message: error.message });
        }
    });

router.route("/bids/:id")

    .get((req, res) => {
        try {
            Bid.findById(req.params.id)
                .then((bid) => { if (user == null) { res.json("no record found") } else { res.json(bid) } })
        }
        catch (error) {
            // console.error('Error:', error);
            res.status(500).json({ message: error.message });
        }
    });

router.route("/bids/add")
    .post((req, res) => {

        try {
            if (req.body.BidID == null || req.body.UserID == null || req.body.BidAmount==null,req.body.ItemID==null) {
                res.json("Please submit all the fields for bid id,user Id and bid amount.")
            } else {
                const BidID = req.body.BidID;
                const ItemID = req.body.ItemID;
                const UserName = req.body.UserName;
                const BidAmount = req.body.BidAmount;
                
                // create a new Book object 
                const newBid = new Bid({
                    BidID,
                    ItemID,
                    UserName,
                    BidAmount
                });

                // save the new object (newBook)
                newBid
                    .save()
                    .then(() => res.json("Bid added!"))
                    .catch((err) => res.status(400).json("Error: " + err));
            }
        } catch (error) {
            // console.error('Error:', error);
            res.status(500).json({ message: error.message });
        }
    });

router.route("/bids/update/:id")
    .put((req, res) => {
        try {
            Bid.findById(req.params.id)
                .then((bid) => {
                    if (bid == null) { res.json("no record found") }
                    else {
                        bid.BidID = req.body.BidID;
                        bid.ItemID = req.body.ItemID;
                        bid.UserName = req.body.UserName;
                        bid.BidAmount= req.body.BidAmount;
                        
                        bid
                            .save()
                            .then(() => res.json("Bid updated!"))
                            .catch((err) => res.status(400).json("Error: " + err));
                    }
                })
                .catch((err) => res.status(400).json("Error: " + err));
        } catch (error) {
            // console.error('Error:', error);
            res.status(500).json({ message: error.message });
        }
    });

router.route("/bids/delete/:id")
    .delete((req, res) => {
        try {
            Bid.findById(req.params.id)
                .then((bid) => {
                    if (bid == null) { res.json("no record found") }
                    else {
                        Bid.findByIdAndDelete(req.params.id)
                            .then(() => {
                                console.log("Bid test");
                                res.json("Bid deleted.")
                            })
                    }
                })
        }
        catch (error) {
            // console.error('Error:', error);
            res.status(500).json({ message: error.message });
        }

    });



