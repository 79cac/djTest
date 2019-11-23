var fs = require('fs-extra');
var unzip  = require('node-unzip-2');
var md5 = require('md5');

let loadImages = async function (req) {

    let time = new Date().getTime();
    let path = md5(time);
    fs.mkdirSync("./upload/" + path);
	let success = await new Promise(function(resolve, reject) {
		try {
			fs.createReadStream('./upload/'+ req.file.filename).pipe(unzip.Extract({ path: './upload/' + path })).on('close', () => {
				resolve(true);
			});
		}
		catch (e) {
			console.log(e);
			resolve(false);
		}
	});

	if (success == false) {
		return false;
	}

	let imageInfo = [];
	let imageDir;
	let errmsg = '';
	let msg = '';
	let totalNumber = 0;

	try {
    	//delete zip file
	    fs.unlinkSync('./upload/'+ req.file.filename);

	    let dir = fs.readdirSync('./upload/' + path);
	    //console.log(dir);

		let exts = ['jpg','png','jpeg','JPG','JPEG','PNG'];

		for (let i of dir) {
	    	if (i == '__MACOSX')
	    		continue;

            imageDir = i;
        }

		imageList = fs.readdirSync('./upload/' + path + '/' + imageDir);

		for (let j of imageList) {
            if (j == ".DS_Store")
                continue;
		    let flag = true;
		    let stat = fs.statSync('./upload/' + path + '/' + imageDir + '/' + j);
		    if (stat.isDirectory()) {
		        continue;
		    }
		    if (stat.size > 2*1024*1024) {
		        flag = false;
		        errmsg += '图片' + j + ' 大于2M.';
		    }
		    if (j.split('.').length < 2) {
		        flag = false;
		        errmsg += '图片' + j + ' 格式错误.';
		    }
		    if (exts.indexOf(j.split('.')[1]) == -1) {
		        flag = false;
		        errmsg += '图片' + j + ' 后缀名错误.';
		    }
		    if (j.split('.')[0].split('+').length < 2) {
		        flag = false;
		        errmsg += '图片' + j + ' 请使用加号分隔.';
		    }
		    if (flag) {
		        totalNumber += 1;
		        imageInfo.push({'studentNum':j.split('.')[0].split('+')[0],'image_url':j});
		    }		    
		}
	} catch (e){
		console.log(e);
		return '导入失败';
	};

	if (errmsg == '') {
		try {
			fs.moveSync('./upload/' + path + '/' + imageDir, './public/image/', { overwrite: true });

			fs.removeSync('./upload/' + path );
			msg = totalNumber.toString() + '名同学录入成功. '
			console.log(msg);
			return imageInfo;		
		} catch (e) {
			console.log(e);
			return '导入失败';
		}

	}	
	else {
		console.log(errmsg);
		try {
			fs.removeSync('./upload/' + path );
		}
		catch (e) {
			console.log(e);
		}
		return errmsg;
	}
	
};

module.exports = {
	loadImages:loadImages
};
