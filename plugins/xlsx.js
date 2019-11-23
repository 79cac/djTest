var xl = require('xlsx');
var fs = require('fs-extra');

//check the file and return an object 
const loadStudentInfo = function (filename) {
	try {
        let workbook = xl.readFile(filename);
        const sheetNames = workbook.SheetNames;
        // sheet 数量为 1
        const worksheet = workbook.Sheets[sheetNames[0]];
        data = xl.utils.sheet_to_json(worksheet);
        let flag = true;
		// check data 
		let errmsg = '';
		for (let j of data) {
			//console.log(j);
			if (typeof(j['学号']) != "number") {
				flag = false;
				errmsg += '有学号未填写，或学号格式错误';
				continue;
            }
        }
        
		if (flag == false) {
			return errmsg;
		}

		return data;
	}
	catch (err) {
		console.log(err);
		return "文件读取错误";
	}

}

const outputQuiz = function(data) {
	try {
        let json = [];
        for (let i of data) {
            let date = new Date(i.time);
            let dateString = date.getFullYear().toString() + "/" + (date.getMonth() + 1).toString() + "/" + date.getDate().toString();
            json.push({ "辅导员姓名": i.teacher_name, "评测班级": i.class_name, "考核时间": dateString,
                "年级":i.grade, "退警部分分数":i.tj_score, "熟悉度部分分数": i.sxd_score,
                "总分":i.score, "评估":i.judgement });
        }
        
        let ss = xl.utils.json_to_sheet(json); //通过工具将json转表对象
        let keys = Object.keys(ss).sort(); //排序 [需要注意，必须从A1开始]
        
        let ref = keys[1]+':'+keys[keys.length - 1]; //这个是定义一个字符串 也就是表的范围
        
        let workbook = { //定义操作文档
            SheetNames:['成绩报告'], //定义表明
            Sheets:{
                '成绩报告':Object.assign({},ss,{'!ref':ref}) //表对象[注意表明]
            },
        }
		xl.writeFile(workbook, './public/download/out.xlsx');
	}
	catch (e) {
		console.log(e);
		return {"data": false};
	}
	return {"data":true, "excel_url": "/static/download/out.xlsx"};
}

module.exports = {
	loadStudentInfo: loadStudentInfo,
	outputQuiz:outputQuiz,
};

