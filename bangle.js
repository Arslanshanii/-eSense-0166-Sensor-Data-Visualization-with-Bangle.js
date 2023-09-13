const Y= 140;
var gatt,characteristic, s, ax, ay, az, gx, gy, gz, data, sign, x;
var gyroXcal, gyroYcal, gyroZcal;
var gyroRoll, gyroPitch, gyroYaw;
var accRoll, accPitch;
var dt, dtTimer;
var date;
var count = 0;
var count1 = 0;
var calibrationCounter = 0;
gyroXcal = gyroYcal = gyroZcal = 0;
gyroRoll = gyroPitch = gyroYaw = 0;
var roll= 0, pitch= 0, yaw= 0;
const tau = 0.50;
const gyroScaleFactor = 65.5;
const accScaleFactor = 8192.0;
const calibrationPts = 250;

g.clear();
// timeout used to update every minute
var drawTimeout;

// schedule a draw for the next minute
function queueDraw() {
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(function() {
    drawTimeout = 0;
    draw();
  }, 60000 - (Date.now() % 60000));
}

function draw() {
  var x = g.getWidth()/2;
  var y = g.getHeight()/2;
  g.reset();
  // work out locale-friendly date/time
  var date = new Date();
  var timeStr = require("locale").time(date,1);
  var dateStr = require("locale").date(date);
  // draw time
  g.setFontAlign(0,0).setFont("Vector",48);
  g.clearRect(0,y-15,g.getWidth(),y+25); // clear the background
  g.drawString(timeStr,x,y);
  // draw date
  y += 35;
  g.setFontAlign(0,0).setFont("6x8");
  g.clearRect(0,y-4,g.getWidth(),y+4); // clear the background
  g.drawString(dateStr,x,y);
  // queue draw in one minute
  queueDraw();
}

// Clear the screen once, at startup
g.clear();
// draw immediately at first, queue update
draw();
// Stop updates when LCD is off, restart when on
Bangle.on('lcdPower',on=>{
  if (on) {
    draw(); // draw immediately, queue redraw
  } else { // stop draw timer
    if (drawTimeout) clearTimeout(drawTimeout);
    drawTimeout = undefined;
  }
});
// Show launcher when middle button pressed
//Bangle.setUI("clock");
// Load widgets
Bangle.loadWidgets();
Bangle.drawWidgets();



NRF.requestDevice({ filters: [{ name: 'eSense-0166' }] }).then(function(device) {
      console.log("Found");
      return device.gatt.connect();
    }).then(function(g) {
      console.log("Connected");
      gatt = g;
      return gatt.getPrimaryService(
        "0xFF06");
    }).then(function(service) {
      s = service;
      return service.getCharacteristic(
        "0xFF07");
    }).then(function(c) {
      return c.writeValue([0x53, 0x17, 0x02, 0x01, 0x14]);
    }).then(function() {
      return s.getCharacteristic(
        "0xFF08");
    }).then(function (c) {
      console.log("Got Characteristic");
      characteristic = c;
      startWriting();
    });



function startWriting() {
  var busy = false;
  date = new Date();
  var seconds = date.getSeconds();
  var i = setInterval(function() {
    if (!gatt.connected) {
      //clearInterval(i);
      return;
    }
 
    if (busy) return;
    busy = true;
    characteristic.on('characteristicvaluechanged', (function(event) {
      data = event.target.value;
      //type = typeof data;
      ax = bytes2num(data.buffer[10], data.buffer[11]);
      ay = bytes2num(data.buffer[12], data.buffer[13]);
      az = bytes2num(data.buffer[14], data.buffer[15]);
      gx = bytes2num(data.buffer[4], data.buffer[5]);
      gy = bytes2num(data.buffer[6], data.buffer[7]);
      gz = bytes2num(data.buffer[8], data.buffer[9]);
      if (calibrationCounter < calibrationPts) {
            // Sum points until a quota has been met
            gyroXcal += gx;
            gyroYcal += gy;
            gyroZcal += gz;
            // Increment counter
            calibrationCounter += 1;
        } else if (calibrationCounter == calibrationPts) {
            // Once quota is met find the average offset value
            gyroXcal /= calibrationPts;
            gyroYcal /= calibrationPts;
            gyroZcal /= calibrationPts;
            // Display message
            console.log("Calibration complete!");
            console.log("\tX axis offset: ", gyroXcal);
            console.log("\tY axis offset: ", gyroYcal);
            console.log("\tZ axis offset: ", gyroZcal);

            // Start a timer
            dtTimer = Date.now();

            // Increment counter once more to show the calibration is complete
            calibrationCounter += 1;

        } else {
            // Turn values into something with a physical representation
            processValues();
            // Send values
            // sendRotation();
            // Print values to console
            console.log(" P: ", pitch);
            if(pitch<=-40 || pitch >=40) {
              if(pitch<=-40)
                count++;
              else if(pitch>=40)
                count1++;
              if(count == 100 || count1 == 100) {
                console.log("PLEASE CORRECT YOUR HEAD POSITION");
                Input = "PLEASE CORRECT YOUR HEAD POSITION";
                g.setFont("6x8");
                g.drawString(Input, 25, 180, true);
                if(count == 100)
                  count = 0;
                else if(count1 == 100)
                  count1 = 0;
              } else {
                //sleep(2000);
                input = "                                         ";
                g.setFont("6x8");
                g.drawString(input, 25, 180, true);
              }
            } else {
              count = 0;
              count1 = 0;
            }
        }
    }));
      characteristic.startNotifications().then(function() {
        busy = false;
      });

  }, 50);

}


function processValues() {
    // Subract the offset calibration values for the gyro
    gx -= gyroXcal;
    gy -= gyroYcal;
    gz -= gyroZcal;

    // Convert gyro values to instantaneous degrees per second
    gx /= gyroScaleFactor;
    gy /= gyroScaleFactor;
    gz /= gyroScaleFactor;

    // Convert accelerometer values to g force
    ax /= accScaleFactor;
    ay /= accScaleFactor;
    az /= accScaleFactor;

    // Get delta time and record time for the next call
    dt = (Date.now() - dtTimer) * 0.001;
    dtTimer = Date.now();

    // Acceleration vector angle
    accPitch = Math.atan2(ay, az) * (180 / Math.PI);
    accRoll = Math.atan2(ax, az) * (180 / Math.PI);

    // Gyro integration angle
    gyroRoll -= gy * dt;
    gyroPitch += gx * dt;
    gyroYaw += gz * dt;

    // Get attitude of filter using a comp filter and gyroYaw
    roll = tau * (roll - gy * dt) + (1 - tau) * (accRoll);
    pitch = tau * (pitch + gx * dt) + (1 - tau) * (accPitch);
    yaw = gyroYaw;
}



function bytes2num(byteA, byteB) {
    // Remove byteA sign and & it and then bit shift. Finally combine with byteB
  var sign = byteB & (1 << 7);
  var x = (((byteB & 0xFF) << 8) | (byteA & 0xFF));
  if (sign) {
       return 0xFFFF0000 | x;  // fill in most significant bits with 1's
  } else {
        return x;
  }
}