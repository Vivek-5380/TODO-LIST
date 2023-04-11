const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _= require('lodash');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

//database part using mongoose
const mongooseDB = mongoose
    .connect(
        "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.8.0/test",
        { useNewUrlParser: true }
    )
    .then(() => {
        console.log("DB Connected");
    });

//create a mongoose schema
const itemSchema = new mongoose.Schema({
    name: String,
});


const listSchema = {
    name:   String,
    items: [itemSchema]
};

//create a mongoose model on this schema
const Item = new mongoose.model("Item", itemSchema);

const List= new mongoose.model('List', listSchema);

//creating new items based on model
const item1 = new Item({
    name: "Welcome to your todolist!",
});

const item2 = new Item({
    name: "Hit the + button to add a new item.",
});

const item3 = new Item({
    name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];


app.get("/", (req, res) => {
    Item.find({})
        .then((foundItems) => {
            if (foundItems.length === 0) {
                // insertion using the model created
                Item.insertMany(defaultItems).then(
                    (result) => {
                        console.log("Items added succesfully");
                    }
                ).catch(
                    (err) => {
                        console.log(err);
                    }
                )
                res.redirect('/');
            }
            res.render("index", { listTitle: "Today", nextTodo: foundItems });
        })
        .catch((err) => {
            console.error(err);
        });
});


app.get("/:customListName",(req,res)=>{
    const customListName = _.capitalize(req.params.customListName);



    List.findOne({name: customListName}).then(
        (foundList)=>{
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();
                res.redirect("/" + customListName);
            }else{
                res.render("index", { listTitle: foundList.name, nextTodo: foundList.items });
            }
        }
    ).catch((err)=>{
        console.log(err);
    });

});

app.post("/", (req, res) => {
    var item = req.body.newItem;
    var listName = req.body.list.trim();

    var addedItem = new Item({
        name: item,
    });

    if (listName === 'Today') {
        addedItem.save().then(
            (result) => {
                console.log("Succesfully added");
            }
        ).catch(
            (err) => {
                console.error(err.message);
            }
        )
        res.redirect("/");
    }else{
        List.findOne({name: listName}).then((foundList)=>{
            foundList.items.push(addedItem);
            foundList.save();
            res.redirect("/" + listName);
        }).catch((err)=>{
            console.log(err);
        });
    }

});


app.post('/delete', (req,res)=>{   
    const itemID = req.body.checkbox;
    const listName = req.body.listName;


    if (listName === 'Today') {
        Item.findByIdAndRemove(itemID).then(
            (result) => {
                console.log("Succesfully deleted");
            }
        ).catch((err) => {
            console.error(err.message);
        });
        res.redirect("/");
    } else {
        List.findOneAndUpdate(
            {name: listName},
            {$pull: {items: {_id: itemID}}}
        ).then(
            (result) => {
                console.log("Succesfully deleted");
                res.redirect('/' + listName);
            }
        ).catch((err) => {
            console.error(err.message);
        });
    }

    
});


app.listen(3000, function () {
    console.log("Server running on Port 3000");
});
