var tpb  = require('thepiratebay'),
    http = require('http'),
    fs   = require('fs'),
    Twitter = require('node-tweet-stream'),
    t_config = require('./config'),
    t = new Twitter(t_config),
    nt = require('node-twitter'),
    whitelist = require("./whitelist");

t.on('tweet', function (tweet) {
  console.log("incoming tweet!");
  if (whitelist[tweet.user.screen_name])
    return handleRequest(tweet.user.screen_name, tweet.text);
  console.error("[on tweet] not in whitelist: " + tweet.user.screen_name);
})

t.on('error', function (err) {
  console.log('Oh no')
})

t.track("@AskFlix");

function handleRequest(username, text) {
  console.log("[handleRequest] username: '" + username + "' - text: '" + text + "'");
  if (text.indexOf("#IWantToWatch") > -1)
    return downloadMovie(username, text);
  console.error("Request not handled from user: " + username + " - text: " + text);
}

function downloadMovie(username, text) {
  text = text.replace(/#IWantToWatch/gi, "");
  text = text.replace(/@askflix/gi, "");

  tpb.search(text, {
    category: '205'
  }).then(function(results){
    var best = results[0];
    for (var i = 0; i < results.length; i++)
      if (parseInt(results[i].seeders) + parseInt(results[i].leechers) > parseInt(best.seeders) + parseInt(best.leechers)) 
        best = results[i];

    console.log("[downloadMovie] downloading: '" + best.name + "'");

    var name = best.name.replace(/ /g, "") + ".torrent";
    name = name.replace(/[^a-zA-Z0-9\.]/g, "");
    var number = best.link.split("/")[4]
    var link = "http://torrents.thepiratebay.se/" + number + "/" + name

    var file = fs.createWriteStream(name);
    var request = http.get(link, function(response) {
      response.pipe(file);
      // exec("mv /home/aqib/torrent-downloader/" + name + " /home/deluge/torrent-files-auto-add/", puts);
      // fs.rename(name, "/home/deluge/torrent-files-auto-add/" + name, function(err){
      //   console.log(err)
      // })
    });

  }).catch(function(err){
    console.log(err);
  });
}
