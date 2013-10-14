/**
 * Created by Lihe on 13-10-13.
 */

var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, title, post, tags){
    this.name = name;
    this.title = title;
    this.post = post;
    this.tags = tags;
}

Post.prototype.save = function(callback){
    var date = new Date();

    var time = {
        date : date,
        year : date.getFullYear(),
        month : date.getFullYear() + '-' + (date.getMonth()+1),
        day : date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate(),
        minute : date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes()
    };


    var post = {
        name : this.name,
        time : time,
        title : this.title,
        post : this.post,
        tags : this.tags,
        comments : []
    };

    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }

        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            collection.insert(post, {safe : true}, function(err, post){
                mongodb.close();
                callback(err, post[0]);
            });
        });
    });
};

Post.get = function(name, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }

        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            var query = {};

            if(name){
                query.name = name;
            }

            collection.find(query).sort({time : -1 }).toArray(function(err, docs){
                mongodb.close();
                if(err){
                    callback(err);
                }

                docs.forEach(function(doc){
                    if(doc.post){
                        doc.post = markdown.toHTML(doc.post);
                    }

                    if(!doc.tags){
                        doc.tags = [];
                    }
                    if(!doc.comments){
                        doc.comments = [];
                    }

                });

               callback(null, docs);
            });
        });
    });
};

Post.getInPage = function(name, pageNumber, pageSize, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }

        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            var query = {};

            if(name){
                query.name = name;
            }

            collection.count(query, function(err, total){
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                collection.find(query, {
                    skip: (pageNumber-1)*pageSize,
                    limit : pageSize
                }).sort({
                        time : -1
                    }).toArray(function(err, docs){
                        mongodb.close();
                        if(err){
                            callback(err);
                        }

                        docs.forEach(function(doc){
                            if(doc.post){
                                doc.post = markdown.toHTML(doc.post);
                            }

                            if(!doc.tags){
                                doc.tags = [];
                            }
                            if(!doc.comments){
                                doc.comments = [];
                            }
                        });

                        callback(null, docs, total);
                    });
            });
        });
    });
};


Post.getOne = function(name, day, title, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }

        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                "name" : name,
                "time.day":day,
                "title":title
            },function(err, doc){
                mongodb.close();
                if(err){
                    return callback(err);
                }

                if(doc&&doc.post){
                    doc.post = markdown.toHTML(doc.post);
                    if(doc.comments){
                        doc.comments.forEach(function(comment){
                            if(comment.content){
                                comment.content = markdown.toHTML(comment.content);
                            }
                        });
                    }

                    if(!doc.tags){
                        doc.tags = [];
                    }
                }
                callback(null, doc);
            });

        });
    });
};

Post.edit = function(name, day, title, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }

        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                "name" : name,
                "time.day" : day,
                "title" : title
            }, function(err, doc){
                mongodb.close();
                if(err){
                    return callback(err);
                }

                if(!doc.comments){
                    doc.comments = [];
                }
                if(!doc.tags){
                    doc.tags = [];
                }

                callback(null, doc);
            });
        });
    });
};

Post.update = function(name, day, title, post, tags, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }

        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            collection.update({
                "name" : name,
                "time.day" : day,
                "title" : title
            },{
                $set : {
                    post : post,
                    tags : tags
                }
            }, function(err, result){
                mongodb.close();
                if(err){
                    callback(err);
                }

                callback(null, result);

            });
        });
    });
};

Post.delete = function(name, day, title, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }

        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            collection.remove({
                "name" : name,
                "time.day" : day,
                "title" : title
            },function(err, result){
                mongodb.close();

                if(err){
                    return callback(err);
                }

                callback(null, result);
            });

        });
    });
}

Post.getArchive = function(name, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }

        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            var query = {};

            if(name){
                query.name = name;
            }

            collection.find(query,{
                //the fields you want to have
                "name" : 1,
                "time" : 1,
                "title" : 1,
                "comments" : 1
            }).sort({
                    time : -1
                }).toArray(function(err, docs){
                    mongodb.close();
                    if(err){
                        return callback(err);
                    }

                    callback(null, docs);
                });
        });
    });
};

Post.getTags = function(name, callback){
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            var query = {};
            if(name){
                query.name = name;
            }

            //distinct 用来找出给定键的所有不同值
            collection.distinct("tags", query, function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }

                if(!docs){
                    docs = [];
                }

                callback(null, docs);
            });
        });
    });
};

Post.getPostsByTag = function(tag, name, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            var query = {
                "tags" : tag
            };

            if(name){
                query.name = name;
            }

            collection.find(query, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                    time: -1
                }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }

                    if(!docs){
                        docs = [];
                    }

                    callback(null, docs);
                });
        });
    });
};

module.exports = Post;