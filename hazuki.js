//ログイン処理
const Discord = require('discord.js');
const ping = require('ping');
const fs = require('fs');
const chokidar = require("chokidar");
const ini = require('ini');

var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });
const token = config.token;


const watcher = chokidar.watch('./data',{
	ignored:/[\/\\]\./,
	persistant:true,
	usePoling: true,
	interval: 1000
});

client.on('ready', () => {
  setInterval(function () {
    var hosts = ['192.168.2.10'];
    hosts.forEach(function (host) {
      ping.sys.probe(host, function (isAlive) {
        var msg = isAlive ? "✅ 起動中" : "❌ 停止中";

        client.user.setPresence({
          activities: [{ name: `${msg}` }],
          status: "online"
        });
        //console.log(`${msg}`);
      });
    });
  }, 1000);
});

watcher.on('ready', function(){
	//準備完了
	console.log("ready watching...");


	//ファイルの編集
	watcher.on('change',function(path){
        	console.log(path + " changed.");

		let text = fs.readFileSync('./data', 'utf-8');
		if(text){	
			text = text.replace(/^\d+\t\d+\t\d+\t(__groupfolders\/1)/gm, '');
			var lines = text.split(/\r\n|\n/);
			lines.pop();
			for(let i=0; i<lines.length; i++){
				for(let j=0; j<lines.length; j++){
					if(i!==j && lines[i].startsWith(lines[j])){
						lines.splice(j,1);
						//console.log(i, j, lines[i]);
						i--; j--;
					}
				}
			}

			//console.log(text);
			var send_message = lines.join('\n');
			//console.log(send_message);
			client.channels.cache.get(config.channel_id).send('```' + send_message + '```');
		}
		
	});
});

client.login(token);
