



const loadLanding = (req,res)=>{
    res.send("welcome user landing");
}

const pageNotFound = (req,res)=>{
    console.log("error page reached")
    res.render("user/404")
}



module.exports= {
    loadLanding,
    pageNotFound
}