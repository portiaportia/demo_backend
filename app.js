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
  .connect("mongodb+srv://portiaportia:II7EPdwPI0Rihf5c@data.ng58qmq.mongodb.net/")
  .then(() => {
    console.log("connected to mongodb");
  })
  .catch((error) => {
    console.log("couldn't connect to mongodb", error);
  });

let houses = [
    {
        "_id":1,
        "name": "Farmhouse",
        "size": 2000,
        "bedrooms": 3,
        "bathrooms": 2.5,
        "features": [
            "wrap around porch",
            "attached garage"
        ],
        "main_image": "farm.webp",
        "floor_plans": [
            {
                "name": "Main Level",
                "image": "farm-floor1.webp"
            },
            {
                "name": "Basement",
                "image": "farm-floor2.webp"
            }
        ]
    },
    {
        "_id":2,
        "name": "Mountain House",
        "size": 1700,
        "bedrooms": 3,
        "bathrooms": 2,
        "features": [
            "grand porch",
            "covered deck"
        ],
        "main_image": "mountain-house.webp",
        "floor_plans": [
            {
                "name": "Main Level",
                "image": "mountain-house1.webp"
            },
            {
                "name": "Optional Lower Level",
                "image": "mountain-house2.webp"
            },
            {
                "name": "Main Level Slab Option",
                "image": "mountain-house3.jpg"
            }
        ]
    },
    {
        "_id":3,
        "name": "Lake House",
        "size": 3000,
        "bedrooms": 4,
        "bathrooms": 3,
        "features": [
            "covered deck",
            "outdoor kitchen",
            "pool house"
        ],
        "main_image": "lake-house.jpg",
        "floor_plans": [
            {
                "name": "Main Level",
                "image": "lake-house1.webp"
            },
            {
                "name": "Lower Level",
                "image": "lake-house2.webp"
            }
        ]
    }
]

app.get("/api/houses",(req,res)=>{
  res.send(houses);
});

app.get("/api/houses/:id", (req,res)=>{
  const house=houses.find((h)=>h._id===parseInt(req.params.id));
  res.send(house);
});

app.post("/api/houses", upload.single("img") ,(req,res)=>{
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
    const house = {
        _id:houses.length+1,
        name:req.body.name,
        size:req.body.size,
        bedrooms:req.body.bedrooms,
        bathrooms:req.body.bathrooms,
        features:req.body.features.split(/\r?\n/).filter(line => line.trim() !== "")
    }

    //adding an image
    if(req.file){
        house.main_image = req.file.filename;
    }

    houses.push(house);
    //console.log(houses);
    res.status(200).send(house);
});

app.put("/api/houses/:id", upload.single("img") , (req,res)=>{
    console.log("In put");
    //console.log(req.body);

    const house = houses.find((h)=>h._id===parseInt(req.params.id));
    
    if(!house){
        res.status(404).send("The house you wanted to modify is not available");
        return;
    }

    const result = validateHouse(req.body);

    if(result.error){
        console.log("Error in validation");
        res.status(400).send(result.error.details[0].message);
        return;
    }

    house.name = req.body.name;
    house.size = req.body.size;
    house.bedrooms = req.body.bedrooms;
    house.bathrooms = req.body.bathrooms;
    house.features = req.body.features.split(/\r?\n/).filter(line => line.trim() !== "");

    //adding an image
    if(req.file){
        house.main_image = req.file.filename;
    }

    res.status(200).send(house);

});

app.delete("/api/houses/:id", (req,res)=>{
    const house = houses.find((h)=>h._id===parseInt(req.params.id));

    if(!house){
        res.status(404).send("The house you wanted to delete is not available");
        return;
    }

    const index = houses.indexOf(house);
    houses.splice(index,1);
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