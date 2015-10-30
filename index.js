const 
    config          = require('./config'),

    express         = require('express'),
    app             = express(),
    server          = require('http').createServer(app),
    io              = require('socket.io').listen(server, config.socketio || {}),

	five			= require("johnny-five"),
	board			= new five.Board({ debug : true });

server.listen(5001);
 
board.on("ready", function() {
	 
	this.pinMode(2, five.Pin.INPUT);
	this.pinMode(3, five.Pin.INPUT);
	this.pinMode(4, five.Pin.INPUT);
	this.pinMode(5, five.Pin.INPUT);
	this.pinMode(6, five.Pin.INPUT);
	this.pinMode(7, five.Pin.INPUT);

	for(var i=8;i<14;i++){
		this.pinMode(i, five.Pin.OUTPUT)
	}

	// Create an Led on pin 13 and strobe it on/off
	// Optionall set the speed; defaults to 100ms
	//(new five.Led(13)).strobe(1000);
	//(new five.Led(9)).strobe(1000);
	//(new five.Pin(12)).high()
	var that = this

	var gear = 0,// 0 = backwards, 1 = forwards 
		active, 
		pins = {
			leftright	: new five.Pin(10),
			frontback	: new five.Pin(11),
			updown		: new five.Pin(9),
			claw		: new five.Pin(8),
			gear		: new five.Pin(13)
		}

	pins.claw.high()
	
	function stop(){	
		console.log("stopping!")
		console.log(active)
		if(!active) return
		pins[active].low()
	}

	function set_gear(state){
		state = state ? 1 : 0
		if(state == gear) return
		gear = state
		pins.gear[state ? "high" : "low"]()	
		console.log("Succesfully gearshifted")
	}
	
	var go = {
		left : function(){
			stop()
			set_gear(0)
			active = "leftright"
			pins.leftright.high()
		},
		right : function(){
			stop()
			set_gear(1)
			active = "leftright"
			pins.leftright.high()
		},
		front : function(){
			stop()
			set_gear(1)
			active = "frontback"
			pins.frontback.high()
		},
		back : function(){
			stop()
			set_gear(0)
			active = "frontback"
			pins.frontback.high()
		},
		up : function(){ 
			stop()
			set_gear(1)
			active = "updown"
			pins.updown.high()
		},
		down : function(){ 
			stop()
			set_gear(0)
			active = "updown"
			pins.updown.high()
		},
		open : function(){
			pins.claw.high()
		},
		close : function(){
			pins.claw.low()
		}
	}


	io.sockets.on('connection', function(socket){
		//(new five.Led(12)).strobe(500);

		socket.on("log", function(input){
			socket.emit("log", input)
		})

		//socket.on("blink", function(pin){
			//console.log("blink:"+pin)
			//var pin = new five.Pin(parseInt(pin))
			//pin.high()
		//})

		socket.on("do", function(action){
			if(action != "stop"){
				if(!go[action]) return
				go[action]()
			}
			if(action == "stop"){
				stop()
			}
		})
		socket.on("disconnect", function(){
			(new five.Led(9).off())
		})
	})
	   
});
