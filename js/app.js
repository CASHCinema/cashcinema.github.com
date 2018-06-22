var nebulas = require("nebulas"),
    NebPay = require("nebpay"),
    Account = nebulas.Account,
    HttpRequest = nebulas.HttpRequest,
    Neb = nebulas.Neb;
    
var nasConfig = {
  mainnet: {
      chainID:'1',
      contractAddress: "n1oXEGorwCr9Fn5XAkBub5k71RAsa5e4z39",
      host: "https://mainnet.nebulas.io",
      payHost: "https://pay.nebulas.io/api/mainnet/pay"
  },
  testnet: {
      chainID:'1001',
      contractAddress: "n21V3PThtoSkQrzuAmKUBnfDGT7JbmxMaGQ",
      host: "https://testnet.nebulas.io",
      payHost: "https://pay.nebulas.io/api/pay"
  }
}
var neb = new Neb();
var chainInfo=nasConfig.mainnet;
// var chainInfo=nasConfig.testnet;

neb.setRequest(new HttpRequest(chainInfo.host));
var nasApi = neb.api;

var nebPay = new NebPay();

var account;
var isMobile;
var dappAddress=chainInfo.contractAddress;
var nonce = "0";
var gas_price = "1000000";
var gas_limit = "2000000";

var callbackUrl = NebPay.config.mainnetUrl; //在主网查询(默认值)
// var callbackUrl = NebPay.config.testnetUrl; //在测试网查询
var serialNumber;
var intervalQuery;  //定时查询交易结果  
var phoneNo = "";
var password = "";
var isLogin = false;
var colorBlackFlag = true;

function getMovieInfo() { 
  $("#load_movie_loading").show();
  var from = Account.NewAccount().getAddressString();
  var value = "0";
  var callFunction = "getMovieInfo";
  var limit = 6;
  var offset = 0;
  var callArgs = "[\"" + limit + "\",\"" + offset + "\"]"
  var contract = {
    "function" : callFunction,
    "args" : callArgs,
  }

  neb.api.call(from, dappAddress, value, nonce, gas_price, gas_limit, contract).then(function(resp) {
    cbSearch(resp);
    $("#load_movie_loading").hide();
  }) .catch(function(err) {
    alert("加载失败,请刷新重试");
    $("#load_movie_loading").hide();
  })
}

//return of search,
function cbSearch(resp) {
  var result = resp.result;
  // console.log("return of rpc call: " + JSON.stringify(result));
  var resultStringify = JSON.stringify(result);

  if (resultStringify.search("Error") !== -1) {
    
    alert("全部加载完毕");
  } 
  // else if (resultStringify.search("null") !== -1) {
  //   alert("null");
  // }
   else {  //搜索成功
    // result = JSON.parse(resultStringify);
    result = JSON.parse(result); 
    console.log("result = " + result);

    var html = $(".all-status").html();

    for (var i = 0; i < result.length; i++) {
      var obj = result[i];
      var movieNumber = obj["movieNumber"];
      var movieName = obj["movieName"];
      var moviePlayer = obj["moviePlayer"];
      var movieDescription = obj["movieDescription"];
      var moviePic = obj["moviePic"];
      // <a class="portfolio-box" href="'+ moviePic +'"> 
      html += '<div class="col-lg-4 col-sm-6"> <a class="portfolio-box" onclick="movieClick('+ movieNumber +')"> <img class="img-fluid" src="'+ moviePic +'" alt=""> <div class="portfolio-box-caption"> <div class="portfolio-box-caption-content"> <div class="project-name"> '+ movieName +'</div>  <div> '+ movieDescription +' </div> </div> </div> </a> </div>';
      // console.log("movieName = " + movieName);
    }
    html = '<div class="row no-gutters popup-gallery">' + html + '</div>';
    $('.all-status').html(html);
  }
}


function register() {
  $("#load_loading").show();
  phoneNo = document.getElementById("minePhoneNo").value;
  password = document.getElementById("minePassword").value;
  var to = dappAddress;
  var value = 0.2;
  var callFunction = "setRegister";
  var callArgs = "[\""  + phoneNo + "\",\"" + password + "\"]"
  serialNumber = nebPay.call(to , value, callFunction, callArgs, {
    callbackUrl : callbackUrl,
    listener : listener,
  });
}

function listener(resp) {
  console.log("listener resp: " + JSON.stringify(resp));
  var result = resp;
  var errorCode = JSON.stringify(resp).search("Error");
  if (errorCode == 1) {
    alert("Error: Transaction rejected by user.");
    $("#load_loading").hide();
  } else {
    onrefreshClick(result["txhash"]);
  }
}

function onrefreshClick(txhash) {
  nasApi.getTransactionReceipt({hash: txhash}).then(function(receipt) {
      console.log("status = " + receipt.status);
      if (receipt.status == 1) {
        console.log("注册成功,处理后续任务...");
        clearInterval(intervalQuery)  //清除定时查询
        $("#load_loading").hide();
        isLogin = true;
        alert("恭喜你成为CASH影院vip用户");
      } else if (receipt.status == 0) {
          clearInterval(intervalQuery)  //清除定时查询
          alert("失败");
          $("#load_loading").hide();
      } else {
        intervalQuery = setTimeout(() => {
          onrefreshClick(txhash);
      }, 1000);    //建议查询频率10-15s,因为星云链出块时间为15s,并且查询服务器限制每分钟最多查询10次。
      }
  });
}

function login() {

  $("#load_loading").show();
  phoneNo = document.getElementById("minePhoneNo").value;
  password = document.getElementById("minePassword").value;
  var to = dappAddress;
  var value = 0;
  var callFunction = "getLogin";
  var callArgs = "[\""  + phoneNo + "\",\"" + password + "\"]"
  serialNumber = nebPay.call(to , value, callFunction, callArgs, {
    callbackUrl : callbackUrl,
    listener : listenerLogin,
  });
}

function listenerLogin(resp) {
  var result = resp;
  var errorCode = JSON.stringify(resp).search("Error");
  if (errorCode == 1) {
    alert("Error: Transaction rejected by user.");
    $("#load_loading").hide();
  } else {
    onrefreshLoginClick(result["txhash"]);
  }
}

function onrefreshLoginClick(txhash) {
  nasApi.getTransactionReceipt({hash: txhash}).then(function(receipt) {
      console.log("status = " + receipt.status);
      if (receipt.status == 1) {
        console.log("登录成功,处理后续任务...");
        clearInterval(intervalQuery)  //清除定时查询
        $("#load_loading").hide();
        isLogin = true;
        alert("欢迎您上线");
      } else if (receipt.status == 0) {
        clearInterval(intervalQuery)  //清除定时查询
        alert("登录失败");
        $("#load_loading").hide();
      } else {
        intervalQuery = setTimeout(() => {
          onrefreshLoginClick(txhash);
      }, 1000);    //建议查询频率10-15s,因为星云链出块时间为15s,并且查询服务器限制每分钟最多查询10次。
      }
  });
}

//点击电影事件
function movieClick(movieNumber) {
  
  if (isLogin == false) {
    alert("请您先登录。");
    return;
  }
  $("#load_movie_loading").show();
  if (phoneNo == '') {
    phoneNo = document.getElementById('minePhoneNo').value;
    password = document.getElementById('minePassword').value;
  } 

  var from = Account.NewAccount().getAddressString();
  var value = "0";
  var callFunction = "getSingleMovie";
  console.log('phoneNo = ' + phoneNo + 'password = ' + password);
  var callArgs = "[\"" + phoneNo + "\",\"" + password + "\",\"" + movieNumber + "\"]"
  var contract = {
    "function" : callFunction,
    "args" : callArgs,
  }

 neb.api.call(from, dappAddress, value, nonce, gas_price, gas_limit, contract).then(function(resp) {
    cbSearchMovie(resp);
    $("#load_movie_loading").hide();
  }) .catch(function(err) {
    alert("获取影片失败");
    $("#load_movie_loading").hide();
  })
}

function cbSearchMovie(resp) {
  var result = resp.result;
  console.log("return of rpc call: " + JSON.stringify(result));
  var resultStringify = JSON.stringify(result);

  if (resultStringify.search("Error") !== -1) {
    
    alert("全部加载完毕");
  } else {  //搜索成功
    // result = JSON.parse(resultStringify);
    result = JSON.parse(result); 
    var address = result["movieAddress"];

    window.open('./moviePlay.html?address='+address);

    console.log("address = " + address);
  }
}

// var isMobile;
var browser = {
  versions: function() {
      var u = navigator.userAgent,
          app = navigator.appVersion;
      return { //移动终端浏览器版本信息
          trident: u.indexOf('Trident') > -1, //IE内核
          presto: u.indexOf('Presto') > -1, //opera内核
          webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
          gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
          mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
          ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
          android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或uc浏览器
          iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器
          iPad: u.indexOf('iPad') > -1, //是否iPad
          webApp: u.indexOf('Safari') == -1, //是否web应该程序，没有头部与底部
          weixin: u.indexOf('MicroMessenger') > -1, //是否微信   
          qq: u.match(/\sQQ/i) !== null//u.indexOf("MQQBrowser")>-1  //是否QQ 
      };
  }(),
  language: (navigator.browserLanguage || navigator.language).toLowerCase()
}


