var middleware = {}
middleware.isLoggedIn = (req, res, next) => {
    //console.log(req.user);
    if(!req.isAuthenticated()){
        return res.redirect("/login");
    }
    return next();
}

middleware.isAdminUser = (req, res, next)=>{
    if(res.locals.curuser.isAdmin)
        return next();
    res.redirect('/');
}
 module.exports = middleware