const chokidar = require('chokidar');
const csvjson= require('csvjson');
const fs= require('fs');
const path = require('path');
var async = require('async');
const find = require('find-process');
const del = require('del');
// const msmq = require('node-msmq');

// var queue = msmq.openOrCreateQueue('.\\Private$\\MyAwesomeQueue');

// // Send message to queue
// queue.send('Hello from Node.JS!');


var pendingOrders = [];
var processWindows = require("node-process-windows");
//const { NodeHotKey, pressKey,releaseKey, KEYCODES } = require("nodehotkey");
//var isProcessingOdin = false;

const {shell,app, globalShortcut,BrowserWindow} = require('electron');
var ks = require('node-key-sender');
const storage = require('node-persist');

var setting = Object;
var orderArray = [];
const {ipcMain}= require('electron');
var myWindow;
const child_process = require('child_process');
const execFile = child_process.execFile;
var isPaused = false;
var expiry ="";
var lotsizeArr = [];


var options = {
  delimiter : ',', // optional
  quote     : '"', // optional
  // headers : "Symbol,time,Date,signal,price,qty,sl,clientcode,expiry,strategy"
  headers : "orderid, id,ex,index,expiry,strike,option_type,Symbol,field1,field2,field3,clientcode,field5,field6,field7,price,qty,field8,field9,status,datetime,datetime,exchangeid,qty,field11,field12"
  // 172000293,11,OPTIDX,FINNIFTY  ,09APR2024,  21200.00,CE,FINNIFTY2440921200CE     ,1 ,RL ,1 ,MRT4 ,6  ,1,120      ,      211.05,2,90030     ,90030       ,OPEN ,       ,04 APR 2024 09:15:00,04 APR 2024 09:15:00,1200000000001217,NIL  ,NSE OPT,          ,          
};
var watcher = {};

init();
async function init(){
  console.log("*********INIT **");

  await storage.init({
    dir: 'config/',
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: 'utf8',
    logging: false,  // can also be custom logging function
    ttl: false, // ttl* [NEW], can be true for 24h default or a number in MILLISECONDS or a valid Javascript Date object
    expiredInterval: 10*60*1000*60, // every 2 minutes the process will clean-up the expired cache
    forgiveParseErrors: false
  });
  setting = await storage.getItem('setting');
  checkBuySellSignal();
}

async function checkBuySellSignal(){
      console.log("Starting .. \n checkBuySellSignal");
      var startTimeObject = new Date();
      var endTimeObject = new Date();
      var now = new Date();

      var csvObj = await fs.readFileSync(setting.file6, { encoding : 'utf8'});
      lotsizeArr = csvjson.toArray(csvObj, options);
      //console.log(lotsizeArr);

      if(setting && setting.start && setting.end){
        var time1 = setting.start;
        var time2 = setting.end;

        
        startTimeObject.setHours(time1.split(":")[0], time1.split(":")[1], 0);        
        endTimeObject.setHours(time2.split(":")[0], time2.split(":")[1], 0);
      }
      expiry = setting.file5;
      var isTimeOk = false;
      //console.log(startTimeObject +">"+now +">"+endTimeObject);

      if(startTimeObject <= now &&  endTimeObject >= now)
      {
        console.log("Ok Good to go.. Algo start ");
        isTimeOk = true;
      }
      else
      {
        setTimeout(function(){
          if(myWindow)
             myWindow.webContents.send('message' , {msg:"Can't start algo due to timing issue !!"});
        },1000);
        console.log("Can't start algo ");
        isTimeOk = false;
      }

      if(isTimeOk && setting && setting.file1){  
        const _path=path.join(setting.file1);//'csv/data.csv');//__dirname, 
        watcher = chokidar.watch(setting.file1, { //'csv/data.csv'
          ignored: /(^|[\/\\])\../, // ignore dotfiles
          persistent: true,
          interval: 500
        });

        

        // Something to use when events are received.
        const log = console.log.bind(console);
        // Add event listeners.
        watcher
          .on('add', path => log(`File ${path} has been added`))
          .on('change', path => log(`File ${path} has been changed`))
          .on('unlink', path => log(`File ${path} has been removed`));

          // More possible events.
          watcher
          .on('addDir', path => log(`Directory ${path} has been added`))
          .on('unlinkDir', path => log(`Directory ${path} has been removed`))
          .on('error', error => log(`Watcher error: ${error}`))
          .on('ready', () => {
              log('Initial scan complete. Ready for changes')
          })
          .on('raw', (event, path1, details) => { // internal
            // log('Raw event info:  --', event, path1, details);

            if(event == 'rename' || event == 'change'){
                  try{
                    var isExist = fs.existsSync(path.join(_path, path1));
                    //console.log('\n\n isExist > '  + path.join(_path, file));
                    if (isExist) {
                      var dataObj = fs.readFileSync(path.join(_path, path1), { encoding : 'utf8'});
                      var data = csvjson.toObject(dataObj, options);
                      processData(data);
                    }
                  } 
                  catch(event){
                    log('Error  ==', event);
                  }

            }
            else{
              log('rename / remove  ==', event, path, details);
            }

                          
          });
      }
    }   

    var odinQueue = async.queue(function (task, callback) {
      console.log("ODIN queue : " + JSON.stringify(task));
      processOdinOrder(task);
      var delay = setting && setting.file4 > 0 ? setting.file4 * 1000 : 3000;
      setTimeout(function () {
          callback();
      }, delay);
  }, 1);



    var q = async.queue(function (task, callback) {
        // console.log("queue : " + JSON.stringify(task));
        processData(task);
        setTimeout(function () {
          callback();
      }, 1000);
    }, 50);

    const checkOrder = (order) => {
      var isMatch = false;
      
      if(orderArray && orderArray.length > 0){
        for (let i = 0; i < orderArray.length; i++) {
          if (orderArray[i]['strategy'] === order.strategy && orderArray[i]['Symbol'] === order.Symbol && orderArray[i]['signal'] === order.signal) {
            isMatch =true;
            break;
          }
            
        }
      }

      return isMatch;
    }

    async function createWindow () {
      myWindow = new BrowserWindow({
        width: 1100,
        height: 768,
        webPreferences: {
          nodeIntegration: true
        }
      })
      myWindow.loadFile('html/index.html');

    }
    
    app.whenReady().then(createWindow)
    
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        //app.quit()
        closeWindow();
      }
    })
    
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    });

    
    ipcMain.on('uploadMyOrder', onUploadMyOrder);
    
    async function onUploadMyOrder(event, orderHistoryArr){
      isPaused = false;
      //var pendingOrder = [];
      
      console.log("\n\n orderHistoryArr ** " + JSON.stringify(orderHistoryArr));
      
      orderHistoryArr.map(order=>{
        if(order.isComplete == 0){
          pendingOrders.push(order);
        }
      });
    

      console.log("\n\n pendingOrders ** " + JSON.stringify(pendingOrders));
      
      q.push([pendingOrders], function (err) {  
        if (err) { return console.log('error in adding tasks to queue'); }  
        console.log('pushed to queue!');  
      });

      event.returnValue = 'Uploading Done';
    }


    ipcMain.on('saveSetting', (event, arg) => {
      storage.setItem('setting',arg);
      checkBuySellSignal();
      event.returnValue = 'saved';
      
    });

    ipcMain.on('getSetting', onGetSetting);
    
    async function onGetSetting(event, arg){
      setting = await storage.getItem('setting');
      event.returnValue = setting;
    }

    ipcMain.on('getBackupOrder', onGetBackupOrder);
    
    async function onGetBackupOrder(event, arg){
      var backupOrder = await storage.getItem('backupOrder');
      if(backupOrder && backupOrder.length >0){
        orderArray = backupOrder;

        var pendingOrder = [];
        orderArray.map(order=>{
          if(order.isComplete == 0){
            pendingOrder.push(order);
          }
        });

        q.push([pendingOrder], function (err) {  
          if (err) { return console.log('error in adding tasks to queue'); }  
          console.log('pushed to queue!');  
        });
        
        backupOrder = backupOrder.sort(function (a, b) {
          a1 = new Date(a.Date);
          a1.setHours(a.time.split(":")[0])
          a1.setMinutes(a.time.split(":")[1])           
          b1 = new Date(b.Date);
          b1.setHours(b.time.split(":")[0])
          b1.setMinutes(b.time.split(":")[1])

          return (b1 - a1);
         });

        event.returnValue = backupOrder;
      }
    }

    ipcMain.on('getSortedOrder', onGetSortedOrder);
    
    async function onGetSortedOrder(event, arg){
      console.log("arg --- " + arg[0] +" > "+ arg[1]);
      var backupOrder = await storage.getItem('backupOrder');
      if(backupOrder && backupOrder.length >0){
        orderArray = backupOrder;
        //console.log(orderArray); 

        if(arg[0] == "Symbol"){
          if(arg[1])
            orderArray.sort((a, b) => ((a[arg[0]]) < (b[arg[0]])) ? 1 : -1)
          else
            orderArray.sort((a, b) => ((a[arg[0]]) > (b[arg[0]])) ? 1 : -1)
        }
        else if(arg[0] == "time"){
          orderArray = orderArray.sort(function (a, b) {
            a1 = new Date(a.Date);
            a1.setHours(a.time.split(":")[0])
            a1.setMinutes(a.time.split(":")[1])           
            b1 = new Date(b.Date);
            b1.setHours(b.time.split(":")[0])
            b1.setMinutes(b.time.split(":")[1])

            return arg[1] ? (a1 - b1) : (b1 - a1);
           });
        }   

        event.returnValue = orderArray;
      }
    }


    function processOdinOrder(data){

      console.log('\nprocessOdinOrder ' + data);

      fs.writeFile(setting.file2, data, function (err) {
        console.log('Write File -- ' + setting.file2);
        if (err) throw console.log(err);
        console.log('Saved Bulk Order!' + JSON.stringify(orderArray));
     
  
        // const child = execFile(setting.file3, [], (error, stdout, stderr) => {
        //   if (error) {
        //       console.error('stderr', stderr);
        //       console.log('*** Error in EXE - ', stdout);
        //   }
        //   else{
        //     console.log('*** RUN EXE - ', stdout);
        //     orderArray = orderArray.map((order)=>
        //     {
        //       order.isComplete = 1;
        //       return order;
        //     });
        //   }

          // orderArray = orderArray.sort(function (a, b) {
          //   a1 = new Date(a.Date);
          //   a1.setHours(a.time.split(":")[0])
          //   a1.setMinutes(a.time.split(":")[1])           
          //   b1 = new Date(b.Date);
          //   b1.setHours(b.time.split(":")[0])
          //   b1.setMinutes(b.time.split(":")[1])
  
          //   return (b1 - a1);
          //  });
            
           
          if(myWindow && myWindow != null && myWindow.webContents != null)
          console.log("SEND",orderArray)
            myWindow.webContents.send('sendOrder' , {msg:orderArray});

          
          storage.setItem('backupOrder',orderArray,{ttl: 10*60*1000*60 });
          pendingOrders = [];
  
        // });
        });
  
    }

    
    
    
    function processData(data){
      var isNewOrder = false;
      var textFile = "";
      var pendingOrder = [];
      //pendingOrders = [];
      console.log(data)
      data = data.map((order)=>
      {
        // console.log(order);
        if(order.signal == "Buy" || order.signal == "Sell")
          order.signal = order.signal == "Buy" ? 1:2;
        order.ex = String(order.Symbol).toUpperCase == ("BANKNIFTY" || "NIFTY") ? "FUTIDX":"FUTSTK";
        // console.log(order);
        //,O,U,3,0,1,FUTIDX,BANKNIFTY,24Sep2020,,,1,,,,22462.3,22462.3,125,,,2,AW0198,For client,,,2,HO

        if(order.Symbol != "" && (!checkOrder(order) || order.isComplete === 0))
        {
          order.isComplete = 0;
          
          isNewOrder = true;
          //isProcessingOdin = true;

          // console.log("New order  > " + JSON.stringify(order));
          if(order.Symbol != ""){
            if(!checkOrder(order))
               orderArray.push(order);

            pendingOrder.push(order);

           // console.log("\n isProcessingOdin -- " + isProcessingOdin);
            if(isPaused){
              pendingOrders.push(order);
            }

            //,O,U,1,0,1,FUTSTK,TECHM,29SEP2022,,,1,,,,1125,,600,,,2,M6000,,,,2,RKV
            //,O,U,1,0,2,FUTSTK,TECHM,29SEP2022,,,1,,,,1165,,600,,,2,M6000,,,,2,RKV
           
            //console.log(lotsizeArr);
            for(let i=0; i<lotsizeArr.length;i++){
              //console.log(lotsizeArr[i]);
              if(lotsizeArr[i]['0'] == order.Symbol.toUpperCase()){
                order.qty = lotsizeArr[i]['1'];
                // console.log(order.qty );
                break; 
              }
              
            }
            
            textFile += ",O,U,1,0,"+order.signal+",";
            textFile += order.ex;
            textFile += ","+order.Symbol;
            textFile += ","+expiry;//order.expiry;
            textFile += ",,,1,,,,";          
            textFile += order.price;
            textFile += ",";//+order.price;
            textFile += ","+order.qty;
            textFile += ",,,2,";
            textFile += order.clientcode;
            textFile += ",For client,,,2,RKV";
            textFile +="\r\n";
            //textFile +="\n";
          }
        }
       
        return order;
      });

      // console.log("Total Orders : " + orderArray.length);
      if(isPaused){
        console.log("\n\n pendingOrders ** " + JSON.stringify(pendingOrders));
      }
      else if(isNewOrder){ //   //Format - ODIN   //,O,U,3,0,1,FUTIDX,BANKNIFTY,24Sep2020,,,1,,,,22462.3,22462.3,125,,,2,AW0198,For client,,,2,HO        
 
        odinQueue.push([textFile], function (err) {  
          if (err) { return console.log('error in adding tasks to odin queue'); }  
          console.log('pushed to odin queue!');  
        });


        orderArray = orderArray.sort(function (a, b) {
          a1 = new Date(a.Date);
          a1.setHours(a.time.split(":")[0])
          a1.setMinutes(a.time.split(":")[1])           
          b1 = new Date(b.Date);
          b1.setHours(b.time.split(":")[0])
          b1.setMinutes(b.time.split(":")[1])

          return (b1 - a1);
         });


        }
    }

    ipcMain.on('closeWindow', closeWindow);
    
    async function closeWindow(event, arg){
      await deleteAmibrokerFile();
      
      console.log("Closing time ************ Clean up--")
      if(myWindow && myWindow != null && myWindow != undefined){
          //myWindow.close();
          myWindow = null;
      }
     
      myWindow = null;
      app.quit();
    }

    
    ipcMain.on('pauseSystem', (event, arg) => {
      isPaused = true;
      event.returnValue = 'Done';
    });

    ipcMain.on('restartWindow', restartWindow);
    
    function restartWindow(event, arg){
      //checkBuySellSignal();
      setTimeout(function(){
        app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
        app.exit(0)
      },1000);
      
    }

    function deleteAmibrokerFile(){
      return new Promise((resolve, reject) =>{
        const directory = setting.file1;
        try{
          if(watcher){
                  watcher.unwatch(directory);
                  watcher.close().then(() => console.log('closed'));
          }
         
          fs.readdir(directory, (err, files) => {
            if (err) throw err;

            for (const file of files) {
                
              fs.unlink(path.join(directory, file), err => {
                if (err) {
                  reject(err);
                  //throw err;
                }
              });
            }

            resolve("Success!");
          });
        }
        catch(e){
          reject(err);
        }
      });
    }
