var request = require('request')
var md5 = require('js-md5')
var router = require('express').Router();
var AV = require('leanengine');
var SignLog = AV.Object.extend('SignLog');
var moment = require('moment');


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function getUrl(username) {
  var url = 'https://zkteco.zkcserv.com/cb_hrms/index.cfm?event=ionicAction.ionicAction.signInAction&_user_name=' + username + '&_pass_word=A5DD89CC477FE32B264C41CA561D2BE8&_is_login=1&_notification_token=13065ffa4e07eebb75b&_device_type=android'
  return url
}

function getLatitude() {
  var origin = 24.6114879;
  return origin;
  //return origin + getRandomInt(1, 5) * 0.0000001;
}

function getLongitude() {
  var origin = 118.0498347;
  return origin;
  //return origin + getRandomInt(1, 5) * 0.0000001;
}

function getAddress() {
  var addrs = ['福建省厦门市集美区集美北大道', '软件园三期B区01', '', '福建省厦门市集美区G15(沈海高速)', '集美北大道靠近集美软件园B区B02'];
  return addrs[getRandomInt(0, addrs.length - 1)]
}

function getCardRecTime(value) {
  return moment().format("hh:mm")
}

function getToken(username) {
  var randomSeed = md5(username || '')
  return randomSeed.substring(6, 22)
}

function sign(userInfo, count) {
  if (count <= 0) {
    return Promise.resolve()
  }
  var sysLog = new SignLog();
  request.post({
    url: getUrl(userInfo.phone),
    form: {
      latitude: getLatitude(),
      longitude: getLongitude(),
      address: getAddress(),
      wifi_value: '',
      wifi_mac: '',
      time_zone: '+8:00',
      card_rec_time: getCardRecTime(userInfo.value),
      mobile_token: getToken(userInfo.phone)
    }
  }, function (err, httpResponse, body) {
    console.log(httpResponse.body);
    sysLog.set('phone', userInfo.phone)
    if (err) {
      sysLog.set('message', err)
      sign(userInfo, --count);
      return;
    } else {
      sysLog.set('message', httpResponse.body)
    }
    try {
      if (JSON.parse(httpResponse.body).flag != 0) {
        
        sign(userInfo, --count);
      } else {
        return Promise.resolve(httpResponse.body)
      }
    } catch (e) {
      sign(userInfo, --count)
    }
    sysLog.save()
  })
}

/**
 * 一个简单的云代码方法
 */
AV.Cloud.define('hello', function (request) {
  var userInfo = {
    phone: "18059805239",
    value: ""
  };
  return new Promise(function (resolve, reject) {
    return sign(userInfo, 10);
  });
});
module.exports = sign