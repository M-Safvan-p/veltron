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
    console.log(name);
    //validationn
    const errorMessage = formValidator.validateCategory(name,description,isListed);
    if(errorMessage)return res.status(400).json({message:errorMessage});
  
    const saveCategory = new Category({
      name,
      description,
      isListed:isListed == "true"
    })
  
    await saveCategory.save();
    
    console.log("done")
    return res.status(200).json({message:"Category added successfully"})
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

const loadEditCategory = async (req, res) => {
  res.render("admin/editCategory", {
    layout: "layouts/adminLayout",
    activePage: "category",
    admin:req.admin,
  });
}; 


module.exports = {
    loadCategory,
    loadAddCategory,
    loadEditCategory,
    addCategory,
};