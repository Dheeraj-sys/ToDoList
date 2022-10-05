require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app=express();
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

const items=[];
const workitems=[];

mongoose.connect("mongodb://localhost:27017/ToDoListDB");

const todoDBSchema=new mongoose.Schema({
  name: String
});
const ToDoCategory = mongoose.model("ToDoCategory",todoDBSchema);

const defaultitems=[];

const newlistSchema=new mongoose.Schema({
  name: String,
  items:[todoDBSchema]
});
const List = mongoose.model("List",newlistSchema);


app.get("/",function(req,res){
  ToDoCategory.find({},function(err,foundItem){
      if(foundItem.length === 0){
        ToDoCategory.insertMany({defaultitems}, function(err){
          if(!err){
            console.log("successfully saved in DB");
            res.redirect("/");
          }
          else{
            console.log(err);
          }
        });
      }
      else{
      res.render("list", {heading: "Today", itemList: foundItem});
      }
});
});


app.get("/:customAdd",function(req,res){
  const newlist = _.capitalize(req.params.customAdd);
  List.findOne({name: newlist}, function(err, result){
    if(!err){
      if(!result){
        const list = new List({
          name: newlist,
          items: defaultitems
        });
        list.save();
        res.redirect("/"+newlist);
      }
      else{
          res.render("list", {heading: result.name, itemList: result.items});
      }
    }
  });
});


app.post("/",function(req,res){
  const itemValue = req.body.newItem;
  const listname = req.body.list;

  const item=new ToDoCategory({
    name: itemValue
  });

  if(listname === "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listname},function(err, result){
      result.items.push(item);
      result.save();
      res.redirect("/"+listname);
    });
  }
});


app.post("/delete",function(req,res){
    const checked=req.body.checkbox;
    const listName=req.body.listName;
    console.log(checked);
    if (listName === "Today") {
      ToDoCategory.findByIdAndRemove(checked,function(err){
          if(err){
            console.log(err);
          }
          else{
            console.log("successfully deleted item");
            res.redirect("/");
          }
      });
    }
  else{
  List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checked}}}, function(err, result){
    if(!err){
      res.redirect("/"+listName);
    }
  });
}
});



let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function(){
  console.log("connected to server");
})
