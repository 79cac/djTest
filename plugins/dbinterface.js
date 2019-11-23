const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://busybox2:27017/dangjian";
const database = "dangjian";

let connect = async function() {

	let db = await new Promise(function(resolve, reject) {
		MongoClient.connect(url, { useNewUrlParser: true },  (err, db) => {
			if (err) {console.log(err); resolve(false);}
			resolve(db);
		});
	});

	if (db == false) {
		return false
	}
	return db;
}

let query = async function(collection, whereStr) {

    db = await connect();
    if (db == false) return false;
    try {
		let rt = await new Promise(function(resolve, reject) {
			db.db(database).collection(collection).find(whereStr).toArray(function(err, result) {
				if (err) {console.log(err); resolve(false)};
                db.close();
                resolve(result);
			});
        });
        return rt;
	}
	catch (e) {
		console.log(e);
		return false;
	}
}

let insert = async function(collection, obj) {

    db = await connect();
    if (db == false) return false;
    try {
		let rt = await new Promise(function(resolve, reject) {
			db.db(database).collection(collection).insertOne(obj, (err, result) => {
                if (err) {console.log(err); resolve(false)};
                db.close();
                resolve(true);
            });
        });
        return rt;
	}
	catch (e) {
		console.log(e);
		return false;
    }
}

let update = async function(collection, whereStr, obj) {

    db = await connect();
    if (db == false) return false;
    try {
		let rt = await new Promise(function(resolve, reject) {
			db.db(database).collection(collection).updateOne(whereStr, obj, {upsert:true}, (err, result) => {
                if (err) {console.log(err); resolve(false)};
                db.close();
                resolve(true);
            });
        });
        return rt;
	}
	catch (e) {
		console.log(e);
		return false;
	}    
}

let remove = async function(collection, whereStr) {

    db = await connect();
    if (db == false) return false;
    try {
		let rt = await new Promise(function(resolve, reject) {
			db.db(database).collection(collection).deleteOne(whereStr, (err, result) => {
                if (err) {console.log(err); resolve(false)};
                db.close();
                resolve(true);
            });
        });
        return rt;
	}
	catch (e) {
		console.log(e);
		return false;
	}      
}

let drop = async function(collection) {
    
    db = await connect();
    if (db == false) return false;
    try {
		let rt = await new Promise(function(resolve, reject) {
			db.db(database).collection(collection).drop((err, result) => {
                if (err) {console.log(err); resolve(false)};
                db.close();
                if (result) 
                    resolve(true);
                else
                    resolve(false);
            });
        });
        return rt;
	}
	catch (e) {
		console.log(e);
		return false;
	}     
}

module.exports = {
    connect:connect,
    query:query,
    insert:insert,
    update:update,
    remove:remove,
    drop:drop,
};