var tpb  = require('thepiratebay'),
    http = require('http'),
    fs   = require('fs'),
    Twitter = require('node-tweet-stream'),
    t_config = require('./config'),
    t = new Twitter(t_config),
    NodeTwitter = require('node-twitter'),
    nt = new NodeTwitter.RestClient(t_config.consumer_key, t_config.consumer_secret, t_config.token, t_config.token_secret),
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

console.log("hi")
getTop3("Captain America", function(best) {
  for (var i = 0; i < best.length; i++)
    console.log("best " + i + ": " + best[i].name + " - " + calcScore(best[i]))
});
console.log("bye")

function tweet(msg, callback) {
  nt.statusesUpdate({"status": msg}, callback);
}

function handleRequest(username, text) {
  console.log("[handleRequest] username: '" + username + "' - text: '" + text + "'");
  if (text.indexOf("#IWantToWatch") > -1) {
    var search = getSearchTerm(text);
    getTop3(search, function(top3) {
      var msg = "@" + username + "\n";

      if (top3.length == 0)
        msg += "None found :( '" + search + "'";

      var remainingChars = 140 - msg.length;
      var charsPerTorrent = remainingChars / 3;
      for (var i = 0; i < top3.length; i++) {
        if (!top3[i])
          continue;

        var s = top3[i].seeders;
        var l = top3[i].leechers;
        var sl = " - " + s + "/" + l;
        msg += i > 0 ? "\n" : "";
        msg += i + ":" + top3[i].name.substring(0, charsPerTorrent - sl.length);
        msg += sl;
      }

      console.log("Sending tweet... " + msg);

      tweet(msg, function(err, data) {
        if (err)
          console.error("Could not sent tweet: " + msg + "\n\n" + err);
        else
          console.log("Tweet sent: " + msg + "\n\n" + data);
      });
    });

    return;

    // return downloadMovie(search);
  }
  console.error("Request not handled from user: " + username + " - text: " + text);
}

function getSearchTerm(text) {
  var search = text.replace(/#IWantToWatch/gi, "");
  search = search.replace(/@askflix/gi, "");
  return search;
}

function calcScore(torrent) {
  return parseInt(torrent.seeders) + parseInt(torrent.leechers);
}

function optimiseList(list, target) {
  for (var i = 0; i < list.length; i++)
    if (list[i] && calcScore(list[i]) < calcScore(target) || !list[i]) {
      list[i] = target;
      return;
    }
}

function getNBest(list, size) {
  console.log("[getNBest] start")
  var best = new Array(size);
  for (var i = 0; i < list.length; i++)
    optimiseList(best, list[i]);

  console.log("[getNBest] end")
  return best;
}

function getTop3(search, callback) {
  tpb.search(search, {
    category: '200'
  }).then(function(results){
    callback(getNBest(results, 3));

  }).catch(function(err){
    console.log(err);
  });
}

// function downloadMovie(search) {
//   tpb.search(search, {
//     category: '205'
//   }).then(function(results){
//     var best = results[0];
//     for (var i = 0; i < results.length; i++)
//       if (parseInt(results[i].seeders) + parseInt(results[i].leechers) > parseInt(best.seeders) + parseInt(best.leechers)) 
//         best = results[i];
//
//     console.log("[downloadMovie] downloading: '" + best.name + "'");
//
//     var name = best.name.replace(/ /g, "") + ".torrent";
//     name = name.replace(/[^a-zA-Z0-9\.]/g, "");
//     var number = best.link.split("/")[4]
//     var link = "http://torrents.thepiratebay.se/" + number + "/" + name
//
//     var file = fs.createWriteStream(name);
//     var request = http.get(link, function(response) {
//       response.pipe(file);
//     });
//
//   }).catch(function(err){
//     console.log(err);
//   });
// }
