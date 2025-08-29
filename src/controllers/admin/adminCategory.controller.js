const Category = require("../../models/common/categorySchema");
const formValidator = require("../../helpers/formValidator");

const loadCategory = async (req, res) => {
  const category = await Category.find({});
  res.render("admin/category", {
    layout: "layouts/adminLayout",
    activePage: "category",
    admin:req.admin,
    category,
  });
};

const listAndUnlist = async (req, res)=>{
  try {
    const id = req.params.id;
    const {isListed} = req.body;
    //change
    await Category.findByIdAndUpdate(id,{isListed})
    res.json({success:true});
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

const loadAddCategory = (req, res) => {
  res.render("admin/addCategory", {
    layout: "layouts/adminLayout",
    activePage: "category",
    admin:req.admin,
  });
};

const addCategory = async (req, res)=> {
  try {
    const { name, description, isListed } = req.body;
    //for case sensitive
    const normalised = name.trim().toLowerCase();

    const findCategory = await Category.findOne({name:normalised});
    if(findCategory)return res.status(400).json({message:"Category already exist"});

    //validationn
    const errorMessage = formValidator.validateCategory(normalised,description,isListed);
    if(errorMessage)return res.status(400).json({message:errorMessage});

    const saveCategory = new Category({
      name:normalised,
      description,
      isListed:isListed == "true"
    })
  
    await saveCategory.save();
    
    return res.status(200).json({success:true, redirectUrl:"/admin/category"})
  } catch (error) {
    console.error("Error add category:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const loadEditCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const category = await Category.findById(id);
    res.render("admin/editCategory", {
      layout: "layouts/adminLayout",
      activePage: "category",
      admin:req.admin,
      category,
    });
  } catch (error) {
    console.error("Error loading edit category page:", error);
    res.status(500).send("Internal Server Error");
  }
}; 

const editCategory = async (req,res) => {
  try {
    const id = req.params.id;
    const {name, description, isListed} = req.body;
    //for case sensitive
    const normalised = name.trim().toLowerCase();
    //validation
    const errorMessage = formValidator.validateCategory(normalised, description, isListed);
    if(errorMessage)return res.status(400).json({message:errorMessage});
     
    await Category.findByIdAndUpdate(id,{name:normalised, description, isListed});
    res.status(200).json({success:true, redirectUrl: "/admin/category" })
  } catch (error) {
    console.error("Error edit category:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
    loadCategory,
    loadAddCategory,
    loadEditCategory,
    addCategory,
    listAndUnlist,
    editCategory,
};