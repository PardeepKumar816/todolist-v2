//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


//mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');
mongoose.connect('mongodb+srv://pardeepmalhi816:CUUnYxXC8hU2SD8@cluster0.l5wt3pb.mongodb.net/todolistDB');

const itemSchema = {
  item: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  item: "Welcome to your todolist!"
});

const item2 = new Item({
  item: "Hit the + button to add a new item"
});

const item3 = new Item({
  item: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


const listSchema = {
  name: String,
  items: [itemSchema],
}

const List = mongoose.model("List", listSchema);



app.get("/", async function (req, res) {

  const day = date.getDate();

  await Item.find({}).exec()
    .then(async foundItems => {
      if (foundItems.length === 0) {
       await Item.insertMany(defaultItems);
        res.redirect("/");
      } else {
        res.render("list", { listTitle: day, newListItems: foundItems });
      }

    })
    .catch(error => {
      console.error(error);
    });



});

app.post("/", async function (req, res) {

  const item = req.body.newItem;
  const listTitle = req.body.list;

  if (listTitle === date.getDate()) {
   await Item.insertMany([{ item: item }]);
    res.redirect("/");
  } else {
  await  List.findOne({ name: listTitle }).exec()
      .then(async foundList => {
        foundList.items.push(new Item({ item: item }));
       await foundList.save();
        res.redirect("/" + listTitle);
      });
  }
});

app.post("/delete", async function (req, res) {
  const itemIdToRemove = req.body.checkbox;
  const listName = req.body.listName;
  
  if (listName===date.getDate()) {
   await Item.findByIdAndRemove(itemIdToRemove).exec()
   .then(result => {
    res.redirect("/");
   });
  } else {
    await List.findOneAndUpdate(
      { name: listName }, 
      { $pull: { items: { _id: itemIdToRemove } } }
    ).exec().then(result => {
      res.redirect("/" + listName);
    })
    .catch(err => {
      console.error(err);
    });
  }

});

app.get("/:customListName", async function (req, res) {
 await List.findOne({ name: req.params.customListName }).exec()
    .then(async foundList => {
      if (!foundList) {
        const myList = new List({
          name: req.params.customListName,
          items: defaultItems,
        });
       await myList.save();
        res.redirect("/" + req.params.customListName);
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }

    });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
