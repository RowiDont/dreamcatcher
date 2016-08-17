var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var _ = require('underscore');
var Nightmare = require('nightmare');

var app = express();

var pdfDefaults = {
  marginsType: 0,
  landscape: true, 
  printBackground: true,
  pageSize: "Letter",
  printSelectionOnly: false
};

var responseHeaderDefaults = function(fileName){
  return {
    'Content-Disposition': 'attachment;filename="' + fileName + '"',
    'Transfer-Encoding': 'binary'
  };
}

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

function generateDownloadData(opts, callback){
  var dataGenerationChain = new Nightmare()
    .viewport(opts.width, opts.height)
    .goto(opts.url)
    .wait();

  if(opts.type === "pdf"){
    dataGenerationChain = dataGenerationChain.pdf(undefined, opts.pdfOptions);
  }else{
    dataGenerationChain = dataGenerationChain.screenshot(undefined, opts.pngClipArea); 
  }

  dataGenerationChain.run(callback).then(function(dataGenerationChain){ dataGenerationChain.end(); });
}

app.post("/export/pdf", function(req,res) {
  var payload, pdfOptions = _.extend( pdfDefaults , req.body.pdfOptions );

  var fileDataResponse = generateDownloadData({
      type: "pdf",
      url: req.body.url,
      width: req.body.width,
      height: req.body.height,
      pdfOptions: pdfOptions
    }, function(err,fileData) {
      var payload = err || fileData;
      if(!err){
        var headers = _.extend( responseHeaderDefaults(req.body.fileName) , { 'Content-Type': 'application/pdf' } );
        res.set(headers);
      }
      res.send(payload);
    });

});

app.post("/export/png", function(req,res) {

  var fileDataResponse = generateDownloadData({
      type: "png",
      url: req.body.url,
      width: req.body.width,
      height: req.body.height,
      pngClipArea: req.body.clipArea,
    }, function(err,fileData) {
      var payload = err || fileData;
      if(!err){
        var headers = _.extend( responseHeaderDefaults(req.body.fileName) , { 'Content-Type': 'image/png' } );
        res.set(headers);
      }
      res.send(payload);
    });
});

var server = app.listen(80, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Dreamcatcher microservice listening at http://%s:%s', host, port);
});


