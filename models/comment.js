/**
 * Created by Lihe on 13-10-13.
 */
var mongodb = require('./db');

function Comment(username, email, website, content, isUser){
    this.username = username;
    this.email = email;
    this.website = website;
    this.content = content;
    this.isUser = isUser;
}

module.exports = Comment;

Comment.prototype.save = function(name, day, title, callback){
    var date = new Date();

    var time = {
        date : date,
        year : date.getFullYear(),
        month : date.getFullYear() + '-' + (date.getMonth()+1),
        day : date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate(),
        minute : date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes()
    };

    var comment = {
        name : this.username,
        email : this.email,
        website : this.website,
        time : time,
        content : this.content,
        isUser : this.isUser
    };

    mongodb.open(function(err, db){
        if(err){
            callback(err);
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
                $push : {"comments" : comment}
            },function(err, result){
                mongodb.close();
                if(err){
                    callback(err);
                }
                callback(null);
            });
        });
    });
}