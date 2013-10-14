/**
 * db.js is for setup of mongodb
 */

var settings = require('../settings');
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;

//数据库名，数据库地址，数据库端口
module.exports = new Db(settings.db, new Server(settings.host, Connection.DEFAULT_PORT, {}));
