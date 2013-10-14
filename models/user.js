var mongodb = require('./db');

function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}

module.exports = User;

/*
** 实例方法
 */
User.prototype.save = function(callback){
    var user = {
        name : this.name,
        password : this.password,
        email : this.email
    }; //构造mongo bson对象

    mongodb.open(function(err, db){
        if(err){
            mongodb.close();
            return callback(err);
        }

        db.collection('users', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            collection.insert(user, {safe : true}, function(err, user){
                if(err){
                    mongodb.close();
                    return callback(err);
                }

                mongodb.close();
                callback(null, user[0]);
            });
        });
    });
};

/*
** 构造函数方法（静态方法）
 */
User.get = function(name, callback){
    mongodb.open(function(err, db){
        if(err){
            mongodb.close();
            return callback(err);
        }

        db.collection('users', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                name : name
            },function(err, user){
                mongodb.close();
                if(user){
                    return callback(null, user);
                }
                return callback(err);
            });
        });
    });
};