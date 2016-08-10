
// node aa.js GroupId msg/sec msgNum

var https = require('https');
var util = require('util');
var process = require("process");

var g_groupId;
var g_sendInterval;
var g_totalCount;

// IM appid
var sdkappid=1400007582;

// 用户id,后面两位是不变的
var identifier="45302542$0"; 

// 用户签名
var usersig="eJxNkFtPg0AQhf8L8U1j9lqriQ9dL1CtlY0FtS*bFRacVCiy21Ji-O8CQeO8zTlzvpPMl7daPJ3adKN0VUHqXXiYoW7O*JR4J4NpDhXURunMmbrzKcaoPxndIaa0U7Tu07*yg8IMsAmhfMKmeNQhNaWDDAYU4xQRzsjRHyxJtrvSKddW5h-MQt5tDzfR1Vxe60UTZcb4B4cfs9fliuIyPg7hObmNYy5iMQvWb-IzdEUh57nI73261O9RSz9Yun9xd00jmN2E-lrQXcAlkvS8DSxEs8uxbG9qC9uyKyQIc0xo-w7kff8AYGZXfA__";

// 视频id
var videoId=14;

function parseInputArgs()
{
	if (process.argv.size < 5){
		console.error('invalid arg num');
		process.exit(0);
	}
	g_groupId = process.argv[2]

	var speed = parseInt(process.argv[3]);
	if (speed < 0 || speed > 500) {
		console.error('invalid speed (0 < speed < 500)');
		process.exit(0);
	}
	g_sendInterval = 1000 / speed;

	g_totalCount = parseInt(process.argv[4]);
}

parseInputArgs();

var g_localSeq = 1;

var g_lock = 1;

var g_time = (new Date).getTime()

var args1 = {
	host : 'yun.tim.qq.com',
	method : 'POST',
	path : '/v4/group_open_http_svc/send_group_msg?sdkappid='+sdkappid+'&identifier='+identifier+'&usersig='+usersig+'&contenttype=json'
};
var args2 = {
	host : 'yun.tim.qq.com',
	method : 'POST',
	path : '/v4/TEST1_group_open_http_svc/send_group_msg?sdkappid='+sdkappid+'&identifier='+identifier+'&usersig='+usersig+'&contenttype=json'
};
var args3 = {
	host : 'yun.tim.qq.com',
	method : 'POST',
	path : '/v4/group_open_http_svc/get_group_info?sdkappid='+sdkappid+'&identifier='+identifier+'&usersig='+usersig+'&contenttype=json'
};

var args = args1

// 消息内容
var formatContent = '{"videoId":'+videoId+',"nickName":"vshow服务压测","smallAvatar":"http://img1.yytcdn.com/artist/fan/150810/0/-M-5a18feb4405b2d22c3565a101a5d7780_0x0.jpg","msgType":0,"content":"测试,seq=%d,时间是 %d","time":%d}';

function doTest()
{
	var localSeq = g_localSeq++;
	var startTime = (new Date).getTime();

	var reqBody = {
		GroupId : g_groupId,
		//Random : localSeq,
		//"From_Account": (6000+localSeq)+'$0',
		"From_Account": identifier,
		MsgBody : [
			{
				MsgType : "TIMCustomElem",
				MsgContent : {
					Data : util.format(formatContent, localSeq, g_time,g_time)
				}
			}
		]
	};
	//console.log("%s", JSON.stringify(reqBody))
	//console.log("begin %d", localSeq);

	var req = https.request(args, function(rsp) {
		//console.log('rsp.statusCode = %d', rsp.statusCode);

		rsp.setEncoding('utf8');

		var chunkList = [];

		rsp.on('data', function(chunk) {
			chunkList.push(chunk);
		});
		rsp.on('end', function() {
			var endTime = (new Date).getTime();
			rspBody = chunkList.join('');
			console.log('local seq = %d, statusCode = %d, timecost = %d, response body: %s', 
				localSeq, rsp.statusCode, (endTime - startTime), rspBody);
			g_lock--;
			if (g_lock == 0) {
				console.log('total cost time: %d  %d', (new Date).getTime() - g_startTime, g_lock);
				var req = https.request(args3, function(rsp) {
					rsp.setEncoding('utf8');

					var chunkList = [];

					rsp.on('data', function(chunk) {
						chunkList.push(chunk);
					});
					rsp.on('end', function() {
						var endTime = (new Date).getTime();
						rspBody = chunkList.join('');
						
						var jsonbody = JSON.parse(rspBody);
						
						afterseq = jsonbody.GroupInfo[0].NextMsgSeq
						console.log('msg seq before: %d, after: %d', beforeseq, afterseq);
					})					
				});

				req.write(JSON.stringify(body1));
				req.end();
			}
		})
	});

	req.write(JSON.stringify(reqBody));
	req.end();
	
}

var g_count = 0;
var g_startTime = (new Date).getTime();

//console.log("max socket: %d", https.globalAgent.maxSockets)
https.globalAgent.maxSockets = 2000

//doTest();



var body1 = {
"GroupIdList": [
g_groupId
    ]
}

var beforeseq = 0;
var afterseq = 0;

var req = https.request(args3, function(rsp) {
		rsp.setEncoding('utf8');

		var chunkList = [];

		rsp.on('data', function(chunk) {
			chunkList.push(chunk);
		});
		rsp.on('end', function() {
			var endTime = (new Date).getTime();
			rspBody = chunkList.join('');
			
			var jsonbody = JSON.parse(rspBody);
			
			beforeseq = jsonbody.GroupInfo[0].NextMsgSeq
			
			var timmer = setInterval(function() {
				if (g_count++ >= g_totalCount) {
					clearInterval(timmer);
			
					g_lock--;
					return;
				}
				g_lock++;
				doTest();
			}, g_sendInterval);
		})
	});

req.write(JSON.stringify(body1));
req.end();










