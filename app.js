//jshint esversion:6

// These are the various packages we have used in this whole project
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash"); // This package has basic functions such as capitalise, etc.

const app = express();
const date = new Date();
const nowDate = date.getDate();
const nowMonth = date.getMonth();
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const nowYear = date.getFullYear();
const currentDate = nowDate + " " + monthNames[nowMonth] + " " + nowYear;
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true })); // This is used to use body parser to access the data that we have typed
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://Lakshay:lakshay7042@cluster0.qhqen.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
  }
);

// This is schema i.e. basic objects that we want in our database
const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

// The item1, item2 and item3 are the predefined items we have added in our list for user convenience
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

// We have created array of items
const defaultItems = [item1, item2, item3];

// This is another schema of another databse called list
const listSchema = {
  name: String,
  items: [itemsSchema], // we have created a relationship between these two schemas
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      // This is used to avoid repetition of some lines like we have added some lines for user convinenice we if user again open this web app then it will repeat those lines that's why we have used this in this if list is empty then it will put those lines in todo list else it will continue as planned
      Item.insertMany(defaultItems, function (err) {
        // Like inserMany we can use this kind of inbulit function by reading mongoose documentation
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      // After inserting the items to desired list if we don't want to display such kind of line like successfully saved in our console we caan also use function(err){}. I have printed these lines in our console for my convenience so that i am able to track if there is any error while working on it
      res.redirect("/");
    } else {
      res.render("list", { listTitle: currentDate, newListItems: foundItems });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName); // This is used to get what we have written ahead local host and we have capatalised first word of that.

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      // We have used this method so that if we type our old created list then we can get out whole work again instead of new list
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list

        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === currentDate) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === currentDate) {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/"); // We have used redirect again so that after deleted the content from the list it will refresh the page and show only the remaining content in the list for user convenience
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        // This is used to delete item from the list other than "Today list". In this pull function pulls the item having _id as checkedItemId and then delete it. And then below if there is no error we have redirected the list to just refresh the page
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
}); // We have dedicated page for about that's why we have created a separate app.get for this

// Here we have assigned our desired port to open this web application with the help of app.listen
let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}
app.listen(port, function () {
  console.log("Server has started successfully");
});
