var dbinf = require('./dbinterface.js');

let connect = function() {
    db = dbinf.connect();
    if (db != false) {
        console.log('DB connect!');
    }
}

let classInfo = async function() {

    rt = await dbinf.query("classInfo", {});
    let tmp = {};
    for (let i of rt) {
        if (tmp[i.school] == undefined)
            tmp[i.school] = [i.className]
        else
            tmp[i.school].push(i.className)
    }
    //console.log(tmp)
    let res = [];
    for (let i in tmp) {
        res.push({'school_name':i,'class_name':tmp[i]})
    }
	return res;
}

let storeInfo = async function(data) {

	let studentInfo = [];
    			
	for (let j of data) {

        // student info
        let student = {};

        student['studentNum'] = j['学号'].toString();
        if (j['姓名'] != undefined)
            student['studentName'] = j['姓名'];
        if (j['班级'] != undefined)
            student['className'] = j['班级'];
        if (j['专业'] != undefined)
            student['major'] = j['专业'];
        if (j['经济情况'] != undefined)
            student['economic'] = j['经济情况'];
        if (j['学籍状态'] != undefined)
            student['status'] = j['学籍状态'];
        if (j['是否退警'] != undefined)
            student['istj'] = j['是否退警'];
        if (j['退警次数'] != undefined)
            student['times'] = j['退警次数'];
        if (j['精神状况'] != undefined)    
            student['mind'] = j['精神状况'];
        if (j['是否班委'] != undefined)
            student['cadre'] = j['是否班委'];
        
        studentInfo.push(student);                
    }	
    
    // check if student info is ok
    let checkisuse = function(student) {
        if (!!student.studentName && !!student.className && !!student.major && !!student.economic
            &&  !!student.istj == false)
            return student
        if (student.istj == '是') {
            if (!!student.times && !!student.mind)
                student.isuse = 1
            return student
        }
        else if (student.istj == '否') {
            if (!!student.cadre)
                student.isuse = 1
            return student
        }
        else {
            console.log("error istj");
            return student
        }
    }

    for (let i of studentInfo) {
        //update student info
        console.log(i.studentNum)
        if (await dbinf.update("studentInfo", {"studentNum": i.studentNum}, {$set: checkisuse(i)}) == false)
            return false;
    }

	return true;
}

let constructClass = async function () {
    // when students class added or changed, we should use this function to reconstruct
    // since there are few times to change students' classes in a year
    rt = await dbinf.query("studentInfo", {});
    let tmp = {};
    let school = {};
    for (let i of rt) {
        if (tmp[i.className] == undefined) {
            tmp[i.className] = [i.studentNum];
            school[i.className] = i.major;
        }
        else
            tmp[i.className].push(i.studentNum);
    }
    
    res = [];
    for (let i in tmp) {
        res.push({'className':i,'studentNum':tmp[i], 'isuse': 1, 'school':school[i]})
    }
    
    for (let i of res) {
        //update class info
        if (await dbinf.update("classInfo", {"className": i.className}, {$set: i}) == false)
            return false;
    }

    return true;
}

let storeImages = async function (data) {

    for (let i of data) {
        if (await dbinf.update("imageInfo", {"studentNum": i.studentNum}, {$set: i}) == false)
            return false;
    }
	return true;
}

let storeQuiz = async function(data) {

    //input check
    if (data.teacher_name == false || data.judgement == false || data.class_name == false)
        return false
    
    let res = {};
    res.teacherName = data.teacher_name;
    res.judgement = data.judgement;
    res.tjscore = data.tj_score;
    res.sxdscore = data.sxd_score;
    res.score = data.score;
    res.time = new Date().getTime();
    //only one class will be string
    if (typeof(data.class_name) == 'string')
        res.className = [data.class_name];
    else
        res.className = data.class_name;
    res.grade = res.className[0].slice(0,3);
    
    rt = await dbinf.insert("quizInfo", res);
    return rt;
}

let quizInfo = async function(data) {

    let condition = {};

    if (data.teacher_name != false) {
        condition.teacherName = data.teacher_name.trim();
    }
    if (data.year != false && data.month != false ) {
        let year = parseInt(data.year)
        let month = parseInt(data.month)
        let a = new Date();
        a.setFullYear(year);
        a.setMonth(month);					
        a.setDate(1);
        a.setMinutes(0);
        a.setHours(0);
        a.setSeconds(1);
        let down = a.getTime();
        a.setMonth(month + 1);
        let up = a.getTime();
        condition.time = {$gt : down, $lt: up};
    }
    else if (data.year != false ) {
        let a = new Date();
        a.setFullYear(parseInt(data.year));
        a.setMonth(0);
        a.setDate(1);
        a.setMinutes(0);
        a.setHours(0);
        a.setSeconds(0);
        let down = a.getTime();
        a.setMonth(12);
        let up = a.getTime();
        condition.time = {$gt : down, $lt: up};
    }

    rt = await dbinf.query("quizInfo", condition);
    console.log(rt);
    let output = [];
    for (let i of rt) {
        output.push({"teacher_name":i.teacherName,"time":i.time.toString(),"score":i.score,"quiz_id":i.time.toString()})
    }
	return {"data":true, "quiz_info":output};
}

let quizShow = async function(data) {

    condition = {"time": parseInt(data.quiz_id)};
    rt = await dbinf.query("quizInfo", condition);
    if (rt == false) return {"data": false};
    let res = rt[0];
    return {"data":true, "teacher_name":res.teacherName, "time":res.time, "grade":res.grade,
        "score":res.score, "class_name":res.className.toString(), "tj_score":res.tjscore,
        "sxd_score":res.sxdscore, "judgement": res.judgement };
}

let startQuiz = async function(data) {

    let allStudent = []; // all student in db
    let readyStudent = [] // all student can be quiz
    let tjStudent = []; // all tj correct
    let sxdStudent = [];  //  all sxd correct & for tj false
    let other_student = []; // all sxd false
    let tjCorrect;
    let tjFalse;
    let sxdCorrect; 
    let sxdFalse;
    
    // one element may be string not array
    if (typeof(data.class_name) == "string")
        data.class_name = [data.class_name]

    for (let i of data.class_name) { 
        let rt = await dbinf.query("classInfo", {"className": i});
        if (rt == false) return false;
        allStudent = allStudent.concat(rt[0].studentNum);
    }
    
    for (let i of allStudent) {
        //check isuse
        let rt = await dbinf.query("studentInfo", {"studentNum": i})
        if (rt == false) continue; // can be return false
        if (rt[0].isuse != 1) 
            continue;
        //check imageurl
        rt = await dbinf.query("imageInfo", {"studentNum": i})
        if (rt == false) continue;
        
        readyStudent.push(i);
    }
    //console.log(readyStudent);
    for (let i of readyStudent) {
        //check tj
        let rt = await dbinf.query("studentInfo", {"studentNum": i})
        if (rt[0].istj == "是")
            tjStudent.push(i);
        else
            sxdStudent.push(i);
    }
    
    let allImage = await dbinf.query("imageInfo", {});
    for (let i of allImage) {
        if (allStudent.indexOf(i.studentNum) != -1) continue;
        other_student.push(i.studentNum);
    }
    if (other_student.length < 5) return false; // no enough images
    //console.log(other_student);

	function getRandomArrayElements(arr, count) {
		let shuffled = arr.slice(0);
		let i = arr.length;
		let min = i - count;
		while (i-- > min) {
			let index = Math.floor((i + 1) * Math.random());
			let temp = shuffled[index];
			shuffled[index] = shuffled[i];
			shuffled[i] = temp;
		}
		return shuffled.slice(min);
    }
    
	if (tjStudent.length > 5)
		tjCorrect = getRandomArrayElements(tjStudent, 5);
    else
        tjCorrect = tjStudent;

    tjFalse = getRandomArrayElements(sxdStudent, 10-tjCorrect.length);
    sxdCorrect = getRandomArrayElements(sxdStudent, 5);
    sxdFalse = getRandomArrayElements(other_student, 5);

	let tjs_info = [];
	let sxd_info = [];
	let tjs_pic_url = [];
    let sxd_pic_url = [];
    
	for (let i of tjCorrect) {
        let result1 = await dbinf.query("imageInfo", {"studentNum": i});
        let result2 = await dbinf.query("studentInfo", {"studentNum": i});
        result2 = result2[0];

        tjs_pic_url.push(result1[0].image_url);
		tjs_info.push({"student_name":result2["studentName"],"major":result2["major"],
			"times":result2["times"],"economic":result2["economic"],"mind":result2["mind"]});			
    }
    
    for (let i of tjFalse) {
        let result1 = await dbinf.query("imageInfo", {"studentNum": i});
        tjs_pic_url.push(result1[0].image_url);
    }

	for (let i of sxdCorrect) {
        let result1 = await dbinf.query("imageInfo", {"studentNum": i});
        let result2 = await dbinf.query("studentInfo", {"studentNum": i});
        result2 = result2[0];

        sxd_pic_url.push(result1[0].image_url);
		sxd_info.push({"student_name":result2["studentName"],"major":result2["major"],"cadre":result2["cadre"],
			"economic":result2["economic"]});	
	}

    for (let i of sxdFalse) {
        let result1 = await dbinf.query("imageInfo", {"studentNum": i});
        sxd_pic_url.push(result1[0].image_url);
    }
	
	output = {"data":true,"tjs_pic_url":tjs_pic_url,"sxd_pic_url":sxd_pic_url,"tjs_num":tjStudent.length,"tjs_info":tjs_info,"sxd_info":sxd_info}
	return output;
}

module.exports = {
    connect:connect,
	classInfo:classInfo,
    storeInfo:storeInfo,
    constructClass:constructClass,
	storeImages:storeImages,
	storeQuiz:storeQuiz,
	quizInfo:quizInfo,
	quizShow:quizShow,
    startQuiz:startQuiz,
};