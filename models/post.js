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
        reprint_info : {},
        comments : [],
        pv : 0
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
                            if(!doc.pv){
                                doc.pv = 0;
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

                    if(!doc.pv){
                        doc.pv = 0;
                    }
                }
                callback(null, doc);
            });

            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                $inc: {"pv": 1}
            }, function (err, res) {
                if (err) {
                    callback(err);
                }
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

Post.delete = function(name, day, title, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //查询要删除的文档
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                //更新原文章所在文档的 reprint_to
                collection.update({
                    "name": doc.reprint_info.reprint_from.name,
                    "time.day": doc.reprint_info.reprint_from.day,
                    "title": doc.reprint_info.reprint_from.title
                }, {
                    $pull: {
                        "reprint_info.reprint_to": {
                            "name": name,
                            "day": day,
                            "title": title
                        }}
                }, function (err, result) {
                    if (err) {
                        mongodb.close();
                        return callback(err);
                    }
                    //删除转载来的文章所在的文档
                    collection.remove({
                        "name": name,
                        "time.day": day,
                        "title": title
                    }, {
                        w: 1
                    }, function (err) {
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }
                        callback(null);
                    });
                });
            });
        });
    });
};

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

Post.search = function(keyword, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp("^.*" + keyword + ".*$", "i");
            collection.find({
                "title": pattern
            }, {
                "name": 1,
                "time": 1,
                "title": 1,
                "post" : 1,
                "pv" : 1,
                "tags" : 1
            }).sort({
                    time: -1
                }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }

                    if(docs){
                        docs.forEach(function(doc, index){
                            if(!doc.tags){
                                doc.tags = [];
                            }
                            if(!doc.pv){
                                doc.pv = 0;
                            }
                        });
                    }else{
                        docs = [];
                    }

                    callback(null, docs);
                });
        });
    });
};

Post.reprint = function(reprint_from, reprint_to, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //找到被转载的原文档
            collection.findOne({
                "name": reprint_from.name,
                "time.day": reprint_from.day,
                "title": reprint_from.title
            }, function (err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }

                var date = new Date();
                var time = {
                    date: date,
                    year : date.getFullYear(),
                    month : date.getFullYear() + "-" + (date.getMonth()+1),
                    day : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate(),
                    minute : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes()
                }

                delete doc._id; //删除原来doc的旧id，致使数据重新生成新的id

                doc.name = reprint_to.name;
                //doc.head = reprint_to.head;
                doc.time = time;
                doc.title =  (doc.title.search("reprint")>0)?doc.title : "[reprint]" + doc.title;
                doc.comments = [];
                doc.reprint_info = {"reprint_from": reprint_from};
                doc.pv = 0;

                //更新被转载的原文档的 reprint_info 内的 reprint_to
                collection.update({
                    "name": reprint_from.name,
                    "time.day": reprint_from.day,
                    "title": reprint_from.title
                }, {
                    $push: {
                        "reprint_info.reprint_to": {
                            "name": reprint_to.name,
                            "day": time.day,
                            "title": doc.title
                        }}
                }, function (err, result) {
                    if (err) {
                        mongodb.close();
                        return callback(err);
                    }
                    //将转载生成的副本修改后存入数据库，并返回存储后的文档
                    collection.insert(doc, {
                        safe: true
                    }, function (err, post) {
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }
                        callback(err, post[0]);
                    });
                });
            });
        });
    });
};

module.exports = Post;