//ログイン処理
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, Client, GatewayIntentBits } = require('discord.js');
const ping = require('ping');
const fs = require('fs');
const chokidar = require("chokidar");
const ini = require('ini');
const wol = require('wake_on_lan');

const config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });
const token = config.token;
const testChannelId = config.test_channel_id; 

const watcher = chokidar.watch('./data',{
	ignored:/[\/\\]\./,
	persistant:true,
	usePoling: true,
	interval: 1000
});

const sliceMessage = (array, number) => {
	const length = Math.ceil(array.length / number);
	return new Array(length).fill().map((_, i) =>
		array.slice(i * number, (i + 1) * number)
	);
}

async function ButtonCreate(channelId) {
	const channel = await client.channels.fetch(channelId);
	const btnBoot = new ButtonBuilder()
		.setCustomId('boot')
		.setLabel('起動')
		.setEmoji('🟢')
		.setStyle(ButtonStyle.Primary);
	channel.send({
		components: [
			new ActionRowBuilder().setComponents(btnBoot)
		]
	});
}

client.on('interactionCreate', async interaction => {
	if(!interaction.isButton() || interaction.customId !== 'boot') {
		return;
	}
	
	wol.wake(config.mac);

	await interaction.reply({
		content: 'サーバを起動しました。\n 5秒後にメッセージが削除されます。',
		ephemeral: true
	});
	await setTimeout(() => {
		interaction.deleteReply();
	}, 5000);
});



client.on('ready', () => {
	//ButtonCreate(testChannelId);

 	setInterval(function () {
    		const host = 'kaede';
    		
      		ping.sys.probe(host, function (isAlive) {
	        
			const msg = isAlive ? "✅ 起動中" : "❌ 停止中";

        		client.user.setPresence({
          			activities: [{ name: `${msg}` }],
		          	status: "online"
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
			//var send_message = lines.join('\n');
			const sendMessage = sliceMessage(lines, 10);
			console.log(sendMessage);
			
			sendMessage.forEach(function(message) {
				client.channels.cache.get(config.channel_id).send('```' + message.join('\n') + '```');
			});
		}
		
	});
});

client.login(token);
