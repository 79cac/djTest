const express = require('express');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var bodyParser = require('body-parser');
var secret = require('./store/secret.js');
var mongo = require('./plugins/mongo.js');
var admin = require('./plugins/admin.js');
var xl = require('./plugins/xlsx.js');
var zip = require('./plugins/unzip.js');
var multer  = require('multer');
var fs = require('fs');
var cors = require('cors');

const PORT = 8080
const app = express()

app.use(session({
    name: 'skey',
    secret: 'xuexihao',  // 用来对session id相关的cookie进行签名
    store: new FileStore(),  // 本地存储session（文本文件，也可以选择其他store，比如redis的）
    saveUninitialized: false,  // 是否自动保存未初始化的会话，建议false
    resave: false,  // 是否每次都重新保存会话，建议false
    cookie: {
        maxAge: 3600 * 1000  // 有效期，单位是毫秒
    }
}));

app.use(cors({
  origin: 'http://localhost:8000',
  credentials: true,
}));

app.use('/static', express.static('public'));

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var upload = multer({ dest: 'upload/' });

// test the database and set the index
mongo.connect();

// middleware
let needLogin = function (req, res, next) {
	if (!!req.session.loginUser) {
        return res.json({data: false});
    }  
    next()
};

let needAdmin = function (req, res, next) {
	if (req.session.loginUser != 'admin') {
        return res.json({data: false});
    }  
    next()
};

// interface
app.post('/bak/login', urlencodedParser, (req, res, next) => {

    var sess = req.session;
    if (req.body.username == secret.adminname && req.body.password == secret.adminpassword){
    	req.session.regenerate(function(err) {
            if(err){
                return res.json({data: '登录失败'});                
            }
            
            req.session.loginUser = 'admin';
            return res.send({data: true});                           
        });
    }
    else if(req.body.username == secret.username && req.body.password == secret.password){
        req.session.regenerate(function(err) {
            if(err){
                return res.json({data: '登录失败'});                
            }
            
            req.session.loginUser = 'user';
            return res.json({data: true});                           
        });
    }
    else{
        return res.json({data: '账号或密码错误'});
    }   
});

app.post('/bak/check', urlencodedParser, (req, res, next) => {

    return res.json({data: true, username: req.session.loginUser});
});

app.post('/bak/logout', (req, res, next) => {  

    req.session.destroy(function(err) {
        if(err){
            console.log(err);
            return;
        }       
        // req.session.loginUser = null;
        res.clearCookie(identityKey);
    });
});

app.post('/bak/classInfo', urlencodedParser, async (req, res, next) => {

    data = await mongo.classInfo();
    return res.json({school_info: data});
});

app.post('/bak/loadStudentInfo', upload.single('studentInfo'), async (req, res, next) => {

    fs.renameSync('./upload/' + req.file.filename, './upload/test.xlsx');

    data = xl.loadStudentInfo('./upload/test.xlsx');
    if (typeof(data) == "string") {
        // errmsg
        return res.json({"data": data});
    }
    
    rt = await mongo.storeInfo(data);
    return res.json({"data": rt});  
});

//should be admin
app.post('/bak/constructClass', async (req, res, next) => {
    rt = await mongo.constructClass();
    return res.json({"data": rt});
});

app.post('/bak/loadImage', upload.single('file'), async (req, res, next) => {

    data = await zip.loadImages(req);

    if (typeof data == "string") {
        //errmsg
        return res.json({"data": data});
    }

    rt = await mongo.storeImages(data);
    return res.json({"data": rt});
});

app.post('/bak/quiz', urlencodedParser, async (req, res, next) => {

    data = await mongo.startQuiz(req.body);
    return res.json(data);
});

app.post('/bak/save', urlencodedParser, async (req, res, next) => {

    data = await mongo.storeQuiz(req.body);
    return res.json({"data": data});
});

app.post('/bak/search', urlencodedParser, async (req, res, next) => {

    data = await mongo.quizInfo(req.body);
    return res.json(data);
})

app.post('/bak/show', urlencodedParser, async (req, res, next) => {

    data = await mongo.quizShow(req.body);
    return res.json(data);
})

// should be admin
app.post('/bak/excel', urlencodedParser, async (req, res, next) => {

    let info = [];
    if (typeof(req.body.quiz_id) == "string")
        req.body.quiz_id = [req.body.quiz_id]

    for (let i of req.body.quiz_id) {
        rt = await mongo.quizShow({"quiz_id":i});
        if (rt == false) return res.json({"data": false});

        info.push(rt);
    }

    let data = xl.outputQuiz(info);
    return res.json(data);
})

app.post('/bak/pdf', urlencodedParser, async (req, res, next) => {

})

app.get('/bak/adm_check', async (req, res, next) => {

    rt = await admin.uploadCheck();
    return res.send(rt);
})

app.post('/bak/adm_del', async (req, res, next) => {
    rt = admin.deleteAll();
    return {data:rt};
})

app.listen(PORT)
console.log(`Running on http://localhost:${PORT}`)