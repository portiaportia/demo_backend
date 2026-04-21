require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Joi = require("joi");
const mongoose = require("mongoose");
const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(cors());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/images/");
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  });
  
const upload = multer({ storage: storage });

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("connected to mongodb");
  })
  .catch((error) => {
    console.log("couldn't connect to mongodb", error);
  });

const houseSchema = new mongoose.Schema({
    name:String,
    size:Number,
    bedrooms:Number,
    bathrooms:Number,
    main_image:String,
    features:[String]
});

const House = mongoose.model("House", houseSchema);

app.get("/api/houses",async(req,res)=>{
    const houses = await House.find();
    res.send(houses);
});

app.get("/api/houses/:id", async(req,res)=>{
  const house = await House.findById(req.params.id);
  res.send(house);
});

app.post("/api/houses", upload.single("img") ,async(req,res)=>{
    //console.log("In post request");
    //console.log(req.body);
    const result = validateHouse(req.body);

    if(result.error){
        console.log("Error in validation");
        res.status(400).send(result.error.details[0].message);
        return;
    }
    console.log("Passed validation");
    console.log(req.body);
    const house = new House({
        name:req.body.name,
        size:req.body.size,
        bedrooms:req.body.bedrooms,
        bathrooms:req.body.bathrooms,
        features:req.body.features.split(/\r?\n/).filter(line => line.trim() !== "")
    });

    //adding an image
    if(req.file){
        house.main_image = req.file.filename;
    }

    const newHouse = await house.save();
    //console.log(houses);
    res.status(200).send(newHouse);
});

app.put("/api/houses/:id", upload.single("img") , async(req,res)=>{
    console.log("In put");

    const result = validateHouse(req.body);

    if(result.error){
        console.log("Error in validation");
        res.status(400).send(result.error.details[0].message);
        return;
    }

    const fieldsToUpdate = {
        name: req.body.name,
        size: req.body.size,
        bedrooms: req.body.bedrooms,
        bathrooms: req.body.bathrooms,
        features: req.body.features.split(/\r?\n/).filter(line => line.trim() !== "")
    }
    //adding an image
    if(req.file){
        fieldsToUpdate.main_image = req.file.filename;
    }

    const success = await House.updateOnehouse({_id:req.params.id}, fieldsToUpdate);

    if(!success) {
        res.status(404).send("We couldn't find that house");
    } else {
        const house = await House.findById(req.params.id);
        res.status(200).send(house);
    }
});

app.delete("/api/houses/:id", async(req,res)=>{
    const house = await House.findByIdAndDelete(req.params.id);

    if(!house){
        res.status(404).send("The house you wanted to delete is not available");
        return;
    }

    res.status(200).send(house);
});

const validateHouse = (house) => {
    const schema = Joi.object({
        _id:Joi.allow(""),
        name:Joi.string().min(3).required(),
        size:Joi.number().required().min(0),
        bedrooms:Joi.number().required().min(0),
        bathrooms:Joi.number().required().min(0),
        features:Joi.allow("")
    });

    return schema.validate(house);
};

//listen for incoming requests
const port = process.env.PORT || 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is up and running on ${port}`);
});