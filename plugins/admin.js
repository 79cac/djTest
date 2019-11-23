var dbinf = require('./dbinterface.js');

let deleteAll = async function() {

    if (await dbinf.drop("quizInfo") == false) return false;
    if (await dbinf.drop("imageInfo") == false) return false;
    if (await dbinf.drop("studentInfo") == false) return false;
    if (await dbinf.drop("classInfo") == false) return false;
    return true;
}

let deleteQuizAll = async function() {

    if (await dbinf.drop("quizInfo") == false) return false;
    return true;
}

let deleteQuizOne = async function(quiz_id) {

}

let deleteClassAll = async function() {

    if (await dbinf.drop("studentInfo") == false) return false;
    if (await dbinf.drop("classInfo") == false) return false;
    return true;
}

let disableClassOne = async function(class_name) {

}

let uploadCheck = async function() {

    allStudent = await dbinf.query("studentInfo", {});
    allImage = await dbinf.query("imageInfo", {});
    
    let studentWithImage = [];
    for (let i of allImage)
        studentWithImage.push(i.studentNum);
    let res = [];
    let image = [];
    for (let i of allStudent) {
        if (i.isuse != 1)
            res.push(i);
        if (studentWithImage.indexOf(i.studentNum) == -1)
            image.push(i);
    }

    let msg = "";
    for (let i of res) {
        msg += "班级" + i.className + "学号" + i.studentNum + "数据未导入" + "\r\n";
    }
    for (let i of image) {
        msg += "班级" + i.className + "学号" + i.studentNum + "图片未导入" + "\r\n";
    }
    return msg;
}

module.exports = {
    deleteAll:deleteAll,
    deleteQuizAll:deleteQuizAll,
    deleteQuizOne:deleteQuizOne,
    deleteClassAll:deleteClassAll,
    disableClassOne:disableClassOne,
    uploadCheck:uploadCheck,
};