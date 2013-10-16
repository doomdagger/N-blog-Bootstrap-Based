
/*
 * GET home page.
 */

var crypto = require('crypto');
var fs = require('fs');
var User = require('../models/user');
var Post = require('../models/post');
var Comment = require('../models/comment');

module.exports = function(app){
    app.get('/', function(req, res){
        var pageNumber = req.query.page ? parseInt(req.query.page) : 1;
        var pageSize = 3;
        var pageAmount;

        Post.getInPage(null, pageNumber, pageSize, function(err, posts, total){
            if(err){
                req.flash('error', 'Blog Ground init failed, try to refresh the page');
                return res.redirect('/500');
            }

            pageAmount = parseInt(total / pageSize);
            if(total % pageSize != 0){
                pageAmount++;
            }

            res.render('index', {
                title : 'Node Blog',
                user : req.session.user,
                success : req.flash('success').toString(),
                error : req.flash('error').toString(),
                posts : posts,
                page : pageNumber,
                pageAmount : pageAmount
            });
        });

    });

    app.get('/signin', beSureNotLogin);
    app.get('/signin', function(req, res){
        res.render('signin', {
            title: 'Node Blog',
            success: req.flash('success').toString(),
            error : req.flash('error').toString(),
            url : ''
        });
    });
    app.get('/signin/:url', function(req, res){
        res.render('signin', {
            title: 'Node Blog',
            success: req.flash('success').toString(),
            error : req.flash('error').toString(),
            url : req.params.url
        });
    });



    app.post('/signin', function(req, res){
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');

        var url = req.body.url;
        if(!url){
            url = '';
        }

        User.get(req.body.name, function(err, user){
            if(err){
                req.flash('error', 'unkown error');
                return res.redirect('/signin');
            }

            if(user){
                if(password!=user.password){
                    req.flash('error', 'wrong password');
                    return res.redirect('/signin');
                }else{
                    req.flash('success', 'welcome back, '+user.name);
                    req.session.user = user;
                    if(req.body.place=='nav'){
                        return res.redirect('back');
                    }else{
                        return res.redirect('/'+url);
                    }
                }
            }else {
                req.flash('error', 'user does not exist');
                return res.redirect('/signin');
            }
        });

    });

    app.get('/signup', beSureNotLogin);
    app.get('/signup', function(req, res){
        res.render('signup', {
            title : 'Node Blog',
            success : req.flash('success').toString(),
            error : req.flash('error').toString()
        });
    });

    app.post('/signup', function(req, res){
        var name = req.body.name;
        var password = req.body.password;
        var passwordRepeat = req.body['password-repeat'];

        if(password!=passwordRepeat){
            req.flash('error', 'passwords are not matched!');
            return res.redirect('/signup');
        }

        var md5 = crypto.createHash('md5');
        password = md5.update(req.body.password).digest('hex');

        var newUser = new User({
            name : name,
            password : password,
            email : req.body.email
        });

        User.get(name, function(err, user){
            if(user){
                req.flash('error', 'user name has been used');
                return res.redirect('/signup');
            }
            newUser.save(function(err){
               if(err){
                   req.flash('error', 'unknown error.')
               }
                req.session.user = newUser;

                req.flash('success', 'successful! you have signed up.');

                return res.redirect('/');
            });

        });

    });

    app.get('/post', beSureLogin);
    app.get('/post', function(req, res){
        var username = req.session.user.name;

        Post.getTags(username, function(err, docs){
            if(err){
                req.flash('error', err);
                return res.redirect('back');
            }

            if(!docs){
                docs = [];
            }

            res.render('post', {
                title : 'Node Blog',
                user : req.session.user,
                success: req.flash('success').toString(),
                error : req.flash('error').toString(),
                tags : docs
            });
        });
    });

    app.post('/post', function(req, res){

        var tags = [];
        if(req.body.tags&&!isArray(req.body.tags)){
            tags[0] = req.body.tags;
        }else if(req.body.tags&&req.body.tags.length>1){
            tags = req.body.tags;
        }

        var currentUser = req.session.user;
        var post = new Post(currentUser.name, req.body.title, req.body.post, tags);

        post.save(function(err){
            if(err){
                req.flash('error', 'post blog failed');
                return res.redirect('/post');
            }

            req.flash('success', 'post blog successful');
            res.redirect('/home/'+currentUser.name);
        });
    });

    app.get('/signoff', beSureLogin);
    app.get('/signoff', function(req, res){
        req.session.user = null;
        req.flash('success', 'you have signed off');
        res.redirect('/');
    });

    app.get('/home/:username', function(req, res){
        var username = req.params.username;
        if(req.session.user){
            if(req.session.user.name==username){
                return res.redirect('/personal');
            }
        }

        User.get(username, function(err, user){
            if(!user){
                req.flash('error', 'user not exist or permission denied');
                return res.redirect('/');
            }

            Post.get(username, function(err, posts){
                if(err){
                    req.flash('error', 'user not exist or permission denied');
                    return res.redirect('/');
                }

                res.render('user', {
                    title : username + '\'s Blog',
                    user : req.session.user,
                    pageOwnerName : username,
                    posts : posts,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });

    app.get('/home/:username/:day/:title', function(req, res){
        var username = req.params.username;
        var day = req.params.day;
        var title = req.params.title;

        Post.getOne(username, day, title, function(err, doc){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }

            //do not need to check is doc is null?? no
            if(!doc){
                req.flash('error', 'blog has already been deleted.');
                return res.redirect('/');
            }

            res.render('blog', {
                title : title,
                post : doc,
                user : req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.post('/home/:username/:day/:title', function(req, res){
        var username = req.params.username;
        var day = req.params.day;
        var title = req.params.title;

        var postUsername = req.body.name;
        var email = req.body.email;
        var website = req.body.website;
        var content = req.body.content;

        var isUser;

        if(!postUsername){
            postUsername = '@Anonymous friend';
        }

        if(req.session.user&&req.session.user.name==postUsername){
            isUser = true;
        }else{
            isUser = false;
        }

        var comment = new Comment(postUsername, email, website, content, isUser);
        comment.save(username, day, title,function(err, result){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', 'comment successful');
            res.redirect('back');
        });
    });


    app.get('/edit/:username/:day/:title', beSureLogin);
    app.get('/edit/:username/:day/:title', function(req, res){
        var username = req.params.username;
        var day = req.params.day;
        var title = req.params.title;

        if(req.session.user.name==username){
            Post.edit(username, day, title, function(err, doc){
                if(err){
                    req.flash('error', err);
                    return res.redirect('back');
                }

                if(!doc){
                    req.flash('error', 'article looking for does not exist, maybe deleted already');
                    return res.redirect('back');
                }

                Post.getTags(username, function(err, docs){
                    if(err){
                        req.flash('error', err);
                        return res.redirect('back');
                    }

                    if(!docs){
                        docs = [];
                    }

                    res.render('edit', {
                        title : 'Edit Article '+doc.title,
                        post : doc,
                        user : req.session.user,
                        success : req.flash('success').toString(),
                        error: req.flash('error').toString(),
                        tags : docs
                    });
                });

            });
        }else{
            req.flash('error', 'you are not the owner of the article, cannot edit');
            return res.redirect('back');
        }
    });

    app.post('/edit/:username/:day/:title', beSureLogin);
    app.post('/edit/:username/:day/:title', function(req, res){
        var currentUser = req.session.user;
        var tags = [];
        if(req.body.tags&&!isArray(req.body.tags)){
            tags[0] = req.body.tags;
        }else if(req.body.tags&&req.body.tags.length>1){
            tags = req.body.tags;
        }

        if(currentUser.name!=req.params.username){
            req.flash('error', 'you are not the owner of the article, cannot edit it');
            return res.redirect('/');
        }

        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, tags, function(err, result){
            var url = '/home/'+req.params.username+'/'+req.params.day+'/'+req.params.title;
            if(err){
                req.flash('error', err);
                return res.redirect(url);
            }
            req.flash('success', 'edit the article successful');
            res.redirect(url);
        });
    });

    app.get('/delete/:username/:day/:title', beSureLogin);
    app.get('/delete/:username/:day/:title', function(req, res){
        var username = req.params.username;
        var day = req.params.day;
        var title = req.params.title;

        if(req.session.user.name!=username){
            req.flash('error', 'you are not the owner of the article, cannot delete it');
            return res.redirect('/');
        }

        Post.delete(username, day, title, function(err, result){
            if(err){
                req.flash('error', err);
                return res.redirect('back');
            }

            req.flash('success', 'delete article successful');
            res.redirect('back');
        });
    });

    app.get('/personal', beSureLogin);
    app.get('/personal', function(req, res){

        Post.get(req.session.user.name, function(err, posts){
            if(err){
                posts = [];
            }
            res.render('personal', {
                title : req.session.user.name + '\'s Personal Center',
                user : req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString(),
                posts : posts
            });
        });
    });

    app.get('/upload', beSureLogin);
    app.get('/upload', function(req, res){

        res.render('upload',{
            title : req.session.user.name + '\'s Upload Center',
            user : req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });


    app.post('/upload', beSureLogin);
    app.post('/upload', function(req, res){

        var fileName = req.body.fileName;
        var file = req.files['file'];
        if(file.size==0){
            fs.unlink(file.path, function(){
                console.log('successfully removed as empty file！');
                req.flash('error', 'empty file');
                return res.redirect('/upload');
            });
        }else {
            var user_path =  './public/tmp/'+req.session.user.name;

            fs.exists(user_path, function(exists){
                if(!exists){
                    fs.mkdir(user_path, function(err){
                        if(err){
                            req.flash('error', 'create user folder encounter exception.');
                            return res.redirect('/upload');
                        }
                        var target_path = user_path+'/'+((fileName)?fileName:req.files[i].name);
                        fs.rename(file.path, target_path, function(){
                            console.log('Successfully renamed a file!'+file.path + '\n' + target_path);
                            req.flash('success', 'files upload successful');
                            return res.redirect('/upload');
                        });

                    });
                }else{
                    var target_path = user_path+'/'+((fileName)?fileName:req.files[i].name);
                    fs.rename(file.path, target_path, function(){
                        console.log('Successfully renamed a file!'+file.path + '\n' + target_path);
                        req.flash('success', 'files upload successful');
                        return res.redirect('/upload');
                    });
                }
            });
        }
    });

    app.get('/archive', beSureLogin);
    app.get('/archive', function(req, res){
        var username = req.session.user.name;

        Post.getArchive(username, function(err, docs){
            if(err){
                req.flash('error', err);
                return res.redirect('back');
            }

            if(!docs){
                docs = [];
            }

            res.render('archive', {
                title : 'archive',
                posts : docs,
                user : req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });

    });


    app.get('/tags', beSureLogin);
    app.get('/tags', function(req, res){
        var username = req.session.user.name;

        Post.getTags(username, function(err, docs){
            if(err){
                req.flash('error', err);
                return res.redirect('back');
            }

            if(!docs){
                docs = [];
            }

            res.render('tags', {
                title : 'tags',
                tags : docs,
                user : req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        });
    });


    app.get('/tags/:tag', function (req, res) {
        var username = null;

        if(req.session.user){
            username = req.session.user.name;
        }

        Post.getPostsByTag(req.params.tag, username, function (err, posts) {
            if (err) {
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('tag', {
                title: 'TAG:' + req.params.tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });


    app.all('/search', function(req,res){
        var keywords = req.query.keywords;

        if(!keywords){
            return res.render('search', {
                title: 'search page',
                posts: null,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        }

        Post.search(keywords, function(err, docs){
            if(err){
                req.flash('error', err);
                return res.redirect('back');
            }

            res.render('search', {
                title: 'Keywords: ' + keywords,
                posts: docs,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });

    });

    app.get('/reprint/:name/:day/:title', beSureLogin);
    app.get('/reprint/:name/:day/:title', function (req, res) {
        var name = req.params.name;
        var day = req.params.day;
        var title = req.params.title;

        var currentUserName = req.session.user.name,
            reprint_from = {name: name, day: day, title: title},
            reprint_to = {name: currentUserName};
        Post.reprint(reprint_from, reprint_to, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', 'reprint successful!!!');
            var url = '/home/' + post.name + '/' + post.time.day + '/' + post.title;
            res.redirect(url);
        });

    });

    app.get('/500', function(req,res){
         res.send('<h1>Code 500</h1>');
    });

    app.use(function (req, res) {
        res.render("404",{
            title: 'Sorry, 404',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    function beSureLogin(req, res, next){
        if(!req.session.user){
            req.flash('error', 'not sign in');
            return res.redirect('/signin'+req.originalUrl);
        }else{
            next();
        }
    }

    function beSureNotLogin(req, res, next){
        if(req.session.user){
            req.flash('error', 'already sign in');
            return res.redirect('back');
        }else{
            next();
        }
    }

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

};