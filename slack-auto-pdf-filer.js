function main() {
  var response = JSON.parse(getSlackLog());
  var messages = response.messages;
  for ( var i = 0; i < messages.length; i++ ){
    var tempfoldername = messages[i].text.match( /#_\w+-*\w*/g );
    var foldername = tempfoldername.toString().slice(2);
    if (!foldername && !messages[i].files){continue;}
    var filename = messages[i].files[0].name;
    var fileid = messages[i].files[0].id;
    var shareresponse = JSON.parse(GenerateShareUrl(fileid));
    if (shareresponse.error === 'already_public'){Logger.log('fuck');continue;}
    Logger.log('success');
    var pub_secret = shareresponse.file.permalink_public.slice(-10); //puburlに使うtokenの切り出し
    var shareurl = shareresponse.file.url_private_download + '?pub_secret=' + pub_secret;
    var folderid = createFolder(foldername);
    var driveurl = upload(foldername,filename,shareurl);   
    Logger.log(driveurl);
  }
}

function createFolder(foldername) {
  var folderslist = [];
  var Folders = DriveApp.getFolders();
  while (Folders.hasNext()) {
    folderslist.push(Folders.next().toString());
  }
  if (folderslist.indexOf(foldername) >= 0){
    return;
  }else{
    var folderid = DriveApp.createFolder(foldername).getId();
  }
  return　folderid;
}

function upload(foldername,filename,url) {
  var Folders = DriveApp.getFoldersByName(foldername);
  var addFolder = Folders.next();
  var response = UrlFetchApp.fetch(url);
  var fileBlob = response.getBlob().setName(filename);　//BlobObjectを用いるとGAS内でテキスト以外の様々なデータの交換ができる
  var drivefile = addFolder.createFile(fileBlob);
  drivefile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return drivefile.getUrl();
}

function getSlackLog() {
  var requestUrl = 'https://slack.com/api/channels.history?';
  var payload = {
    // Slack Token
    'token': 
    // Channel ID
    'channel': 
    // 25時間分のメッセージ取得
    // 25時間前に戻る　oldest から now まで
    'oldest': parseInt( new Date() / 1000 ) - (60 * 60 * 25)
  }
  
  // パラメータの設定
  var param = [];
  //parse
  for (var key in payload) {
    param.push(key + '=' + payload[key]);
  }
  requestUrl += param.join('&');
  
  return UrlFetchApp.fetch(requestUrl);
}

function GenerateShareUrl(fileid) {
  var requestUrl = 'https://slack.com/api/files.sharedPublicURL?';
  var payload = {
    // Slack Token
    'token': 
    // Channel ID
    'file': fileid
  }
  
  // パラメータの設定
  var param = [];
  //parse
  for (var key in payload) {
    param.push(key + '=' + payload[key]);
  }
  requestUrl += param.join('&');
  
  return UrlFetchApp.fetch(requestUrl);
}
