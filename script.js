var canvas = document.getElementById('field');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var cw = canvas.width;
var ch = canvas.height;
var context = canvas.getContext('2d');

var agents = [];

var controls = new function() {
  this.n_agents = 10;
  this.unit = 100;
  this.agent_size = 0.3*this.unit;
  this.agent_speed = 0.05*this.unit;
  this.comm_range = 2.5*this.unit;
  this.r_illuminated = 0.51*this.unit;
  this.r_shadowed = 0.4*this.unit;
  this.light_radius = 30;
  this.alpha = 1.0;
  this.r_avoid_light = 0.50;
  this.r_avoid_shad = 0.41;
}

window.onload = function() {
  var gui = new dat.GUI();
  gui.add(controls, 'n_agents', 1, 50, 1);
  controller = gui.add(controls, 'unit', 100, 200);
  gui.add(controls, 'alpha', 0, 1);
  var light_controller =  gui.add(controls, 'r_avoid_light', 0, 2);
  var shad_controller = gui.add(controls, 'r_avoid_shad', 0, 2);

  controller.onChange(function(value) {
    controls.agent_size = 0.3*controls.unit;
    controls.agent_speed = 0.05*controls.unit;
    controls.comm_range = 2.5*controls.unit;
    controls.r_illuminated = controls.r_avoid_light*controls.unit;
    controls.r_shadowed = controls.r_avoid_shad*controls.unit;
    renderAgents();
  });

  light_controller.onChange(function(value){
    controls.r_illuminated = controls.r_avoid_light*controls.unit;
    renderAgents();
  });

  shad_controller.onChange(function(value){
    controls.r_shadowed = controls.r_avoid_shad*controls.unit;
    renderAgents();
  });
};

function Field(width, height) {
  this.width=width;
  this.height=height;

  this.light_x = cw * 0.8;
  this.light_y = ch * 0.5;

  this.render=function() {
    // Draw field
    context.beginPath();
    context.strokeStyle="black";
    context.rect(1,1, this.width-1, this.height-1);
    context.fillStyle = "#333E50";
    context.fill();
    context.stroke();
    context.closePath();

    // Draw light
    context.beginPath();
    context.fillStyle = "#FFBF01";
    context.arc(this.light_x, this.light_y, controls.light_radius, 0, 2*Math.PI);
    context.shadowBlur = 40;
    context.shadowColor = "#FFBF01";
    context.fill();
    context.closePath();

    context.shadowBlur = 0;

    // Counter
    context.font = "25px Courier New";
    context.strokeStyle = "rgb(255,255,255,0.7)";
    context.strokeText("Steps: " + counter, 10, 25);
  }
}

function Agent(x, y, color, id) {
  this.x = x;
  this.y = y;
  this.angle = Math.random()* Math.PI * 2;
  this.vX = Math.sin(this.angle);
  this.vY = Math.cos(this.angle);
  this.color = color;
  this.radius = controls.r_shadowed;
  this.id = id;
  this.n_in_range = -1;

  this.state = "light";

  this.range_store = -1;

  this.render = function() {
    // Bot Body
    context.beginPath();
    context.arc(this.x, this.y, controls.agent_size, 0, 2 * Math.PI, false);
    context.fillStyle = this.state == "light" ? "#EE823A" : "#A94C11";
    //context.fillStyle = this.color;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = this.color;
    context.stroke();
    context.closePath();

    // Orientation:
    context.beginPath();
    context.arc(this.x, this.y, controls.agent_size, this.angle - 0.2, this.angle + 0.2);
    context.lineWidth = 4;
    context.strokeStyle = "white";
    context.stroke();
    context.closePath();    
    // N Communication partners:
    context.lineWidth = 2;
    context.font = "20px Arial";
    context.strokeStyle = "#FFFD7E";
    context.strokeText(this.n_in_range, this.x-6, this.y+7);
  };

  this.renderCommRadius = function() {
        // Communication Radius
        context.beginPath();
        context.globalAlpha = 0.4;
        context.arc(this.x, this.y, controls.comm_range , 0, 2 * Math.PI, false);
        context.strokeStyle = "#4F5B6C"; //darkgray";
        context.lineWidth = 3;
        context.stroke();
        context.closePath();
        context.globalAlpha = 1;
  }

  this.renderCollisionRadius = function() {
       // Collision Radius
       context.beginPath();
       context.globalAlpha = 0.6;
       context.lineWidth = 2;
       context.strokeStyle = "#5EA7D1";
       context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
       context.stroke();
       context.closePath();
       context.globalAlpha = 1;
  }

  this.move = function() {
    this.vX = Math.cos(this.angle);
    this.vY = Math.sin(this.angle);

    this.x += this.vX * controls.agent_speed;
    this.y += this.vY * controls.agent_speed;
    /**
    // FIELD WALL COLLISION
    if (this.x > cw - controls.agent_size/2 && this.vX > 0) {
        this.vX = -this.vX;
    }
    if (this.y > ch - controls.agent_size/2 && this.vY > 0) {
        this.vY = -this.vY;
    }
    if (this.x < controls.agent_size/2 && this.vX < 0) {
        this.vX = -this.vX;
    }
    if (this.y < controls.agent_size/2 && this.vY < 0) {
        this.vY = -this.vY;
    }
    */
  };

  this.stateWrapper = function(agents) {
    this.state = this.lightOrShadow(agents);
    this.radius = this.state == "light" ? controls.r_illuminated : controls.r_shadowed;
  };

  this.lightOrShadow = function(agents) {
    var state = "light"; 
    for (a of agents) {
      //if (a.id != this.id && a.x > this.x && a.y < this.y + controls.agent_size && a.y > this.y - controls.agent_size) {
      //  state = "shadow";
      //}
      
      if (a.id != this.id && this.lineCircleCollision(a) && 
          this.agentBetweenMeAndLight(a)) {
        state="shadow";
      }
    }
    return state;
  }

  this.agentBetweenMeAndLight = function(agent) {
           // I am farer away from the light        AND
    return gen_dist(this.x, this.y, field.light_x, field.light_y) > gen_dist(a.x, a.y, field.light_x, field.light_y) && 
           // My distance to the light is bigger than my distance to the agent
           gen_dist(this.x, this.y, field.light_x, field.light_y) > gen_dist(a.x, a.y, this.x, this.y);
  }
  
  this.lightLine = function (agent) {
    var a = field.light_y - agent.y;
    var b = agent.x - field.light_x;
    var c = -(a*agent.x + b * agent.y);
    return [a, b, c];
  }

  this.lineCircleCollision = function(agent) {
    var line = this.lightLine(this);
    var a = line[0];
    var b = line[1];
    var c = line[2];

    var r = controls.agent_size;
    var x = agent.x;
    var y = agent.y;

    var dist = Math.abs(a*x + b *y +c) / Math.sqrt(a*a+b*b);
    return dist <= r;
  }


  this.stepWrapper = function(agents) {
    this.checkCommunicationRange(agents);
    this.collisionWrapper(agents);
    this.move();
    this.stateWrapper(agents);
  }

  this.renderWrapper = function() {
    this.renderCommRadius();
    this.renderCollisionRadius();
    this.render();
  }

  this.collisionWrapper = function(agents) {
    for (a of agents) {
      if (a.id != this.id && dist(this, a) <= this.radius + controls.agent_size) {
        //console.log("collision between: "+ a.id + " and " + this.id);
        var deltaX = this.x - a.x;
        var deltaY = this.y - a.y;
        var collAngle = Math.atan2(deltaY, deltaX);
        this.angle = (collAngle);
        //console.log(`collision angle: ${collAngle} - new angle: ${this.angle}`);
        break;
      }
    }

  }
  this.countPartnersInRange = function(agents) {
    var botsInRange = 0;
    for (a of agents) {
      if (a.id != this.id && dist(a, this) <= controls.comm_range) {
        botsInRange++;
      }
    }
    return botsInRange;
  };

  this.checkCommunicationRange = function(agents) {
    var new_n_in_range = this.countPartnersInRange(agents);

    // If in Coherence -> check if partners in range has increased
    // if so -> new random direction
    if (new_n_in_range > this.n_in_range) {
      this.angle = Math.PI * 2 * Math.random();
      
    } 
    else if (new_n_in_range < this.n_in_range &&
      this.n_in_range < controls.n_agents*controls.alpha) {
      this.angle = (this.angle + Math.PI) % (Math.PI * 2);
    }
    this.n_in_range = new_n_in_range;
  }

  this.initStates = function(agents) {
    this.n_in_range = this.countPartnersInRange(agents);
    this.state = this.lightOrShadow(agents);
  }
}

function dist(a1, a2) {
  return Math.sqrt(Math.pow(a1.x - a2.x, 2) + Math.pow(a1.y - a2.y, 2));
}

function gen_dist(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
}

function collision(a1, a2) {
  return dist(a1,a2) < controls.agent_size * 2;
}

function getRandomColor() {
  var rint = Math.round(0xffffff * Math.random());
  return 'rgba(' + (rint >> 16) + ',' + (rint >> 8 & 255) + ',' + (rint & 255) + ', 0.6)';
}

var field = new Field(cw, ch);


function findSpawnXY(startX, startY, agents) {
  var collision = true;  
  var dx = Math.random()  - 0.5;
  var dy = Math.random()  - 0.5;

  var x = startX;
  var y = startY;

  while (collision) {
    var currColl = false;
    for (a of agents) {
      if (Math.sqrt((a.x-x) * (a.x-x) + (a.y-y) * (a.y-y)) < controls.r_illuminated * 2) {
        currColl = true;
      }
    }
    x += dx;
    y += dy;
    if (x < 0 + controls.agent_size || x > ch - controls.agent_size) {
      dx *= -1;
    }
    if (y < 0 + controls.agent_size || y > cw - controls.agent_size) {
      dy *= -1;
    }
    collision = currColl;
  }
  return [x,y];
}

function init() {
  field.render();
  agents = [];

  var startX = Math.floor(Math.random() * cw / 2) + controls.agent_size;
  var startY = Math.floor((Math.random() * ch / 3) - controls.agent_size*2 + ch/3);
  for (var i = 0; i < controls.n_agents; i++) {
    var pos = findSpawnXY(startX, startY, agents);
    agents.push(new Agent(pos[0], pos[1], 
                          getRandomColor(), 
                          i));
  }

  for (var i = 0; i < agents.length; i++) {
    agents[i].initStates(agents);
    agents[i].renderCommRadius();
    agents[i].renderCollisionRadius();
    agents[i].render();
  }

  chart = createPlot();
  if (!initialized) {
    requestAnimationFrame(update);
    initialized = true;
  }
}

function update() {
    requestAnimationFrame(update);

  context.clearRect(0, 0, canvas.width, canvas.height);
  field.render();
  for (var i = agents.length - 1; i >= 0; i--) {
    if (run) {
      agents[i].stepWrapper(agents);
    }
    agents[i].renderWrapper();
  }

  if (counter % 50 == 0) {
    chart.data.labels.push(counter);

    var coherence = calcCoherence(agents);
    chart.data.datasets[0].data.push(coherence); 
    coherenceData.push(coherence);

    var avgDist = calcAvgDistToLight(agents);
    chart.data.datasets[1].data.push(avgDist);
    avgDistData.push(avgDist);
    chart.update();

    var centroid = calcCentroid(agents);
    centroidXData.push(centroid[0]);
    centroidYData.push(centroid[1]);

    r_ai_data.push(controls.r_illuminated/controls.unit);
    r_as_data.push(controls.r_shadowed/controls.unit);

    step_data.push(counter);
    counter++;
  }
  if (run) {
    counter ++;
  }
  
}

var coherenceData = [];
var avgDistData = [];
var centroidXData = [];
var centroidYData = [];
var r_ai_data = [];
var r_as_data = [];
var step_data = [];

var counter = -1; 
var run = false;
var initialized = false;
init();

function startPause() {
  if (!run) {
    run = true;
  } else {
    run = false;
  }
}

function pause() {
  run = false;
}

function reset() {
  coherenceData = [];
  cvgDistData = [];
  centroidXData = [];
  centroidYData = [];
  counter = -1;
  init();
}

function createPlot() {
  var ctx = document.getElementById("plot").getContext("2d");
  ctx.backgroundColor = 'rgba(255,0,0,255)';
  
  var myChart = new Chart(ctx, {
    type: 'line',
    data: {
      //labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
      labels: [],
      datasets: 
      [{label: 'coherence',
        data: [],
        //borderColor: ['rgba(255, 99, 132, 1)'],
        backgroundColor: 'rgba(185, 214, 200, 0)'
       }, 
      {
        label: 'avg. distance to light',
        data: [],
        backgroundColor: 'rgba(185, 214, 200, 0)',
      } ] 
      /*[{
          label: 'coherence',
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)'
        ],
        borderColor: [
            'rgba(255, 99, 132, 1)'
        ],
          borderWidth: 1
      }]*/
  },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        colorschemes: {
          scheme: 'office.Aspect6'
          //scheme: 'office.Forte6'
        }
      }
    }
  })

  return myChart;
}

function renderAgents() {
  for (a of agents) {
    a.stateWrapper(agents);
    a.renderCommRadius();
  }
  for (a of agents) {
    a.renderCollisionRadius();
  }
  for (a of agents) {
    a.render();
  }
}

function calcCentroid(agents) {
  var sumX = 0;
  var sumY = 0;
  for (a of agents) {
    sumX += a.x;
    sumY += a.y;
  }
  return [sumX / agents.length, sumY / agents.length]
}

function calcCoherence(agents) {
  var centroid = calcCentroid(agents);
  //console.log("centroid:" + centroid);
  var distSum = 0;
  for (a of agents) {
    distSum += Math.sqrt(Math.pow(a.x - centroid[0], 2) + Math.pow(a.y - centroid[1],2));
  }
  return distSum / agents.length / controls.unit;
}

function calcAvgDistToLight(agents) {
  var sum = 0;
  for (a of agents) {
    sum += Math.sqrt(Math.pow(a.x - field.light_x, 2) + Math.pow(a.y - field.light_y, 2));
  }
  return sum / agents.length / controls.unit;
}

var csvFile = null;
function makeCSVFile() {
  var text = "step,coherence,avgDistance,centroidX, centroidY, r_ai, r_as\n";
  for (var i = 0; i < coherenceData.length; i++) {
    text += step_data[i] + ","+ coherenceData[i] +"," + avgDistData[i] + "," + centroidXData[i]/controls.unit +"," + 
    centroidYData[i]/controls.unit +"," + r_ai_data[i] + ","+ r_as_data[i] +  "\n";
  }
  //console.log("text:" + text);
  var data = new Blob([text], {type: 'text/plain'});

  // If we are replacing a previously generated file we need to
  // manually revoke the object URL to avoid memory leaks.
  if (csvFile !== null) {
    window.URL.revokeObjectURL(csvFile);
  }

  csvFile = window.URL.createObjectURL(data);
  return csvFile;
}

function downloadData() {
  var link = document.createElement('a');
    link.setAttribute('download', 'data.csv');
    link.href = makeCSVFile();
    document.body.appendChild(link);

    // wait for the link to be added to the document
    window.requestAnimationFrame(function () {
      var event = new MouseEvent('click');
      link.dispatchEvent(event);
      document.body.removeChild(link);
		});
}

function radiusExperiments() {
  var r_ai_list = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5];
  var r_as_list = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5];

  var n_steps = 2000;

  for (r_ai of r_ai_list) {
    for (r_as of r_as_list) {
      console.log(`Setting r_ai: ${r_ai}, r_as: ${r_as} start.`)

      controls.r_illuminated = r_ai * controls.unit;
      controls.r_shadowed = r_as * controls.unit;
      agents = [];
      counter = 0;

      var startX = Math.floor(Math.random() * cw / 2) + controls.agent_size;
      var startY = Math.floor((Math.random() * ch / 3) - controls.agent_size*2 + ch/3);
      for (var i = 0; i < controls.n_agents; i++) {
        var pos = findSpawnXY(startX, startY, agents);
        agents.push(new Agent(pos[0], pos[1], 
                              getRandomColor(), 
                              i));
      }

      for (var step = 0; step <= n_steps; step++) {
        for (a of agents) {
          a.stepWrapper(agents);
        }

        if (step % 50 == 0) {
          var coherence = calcCoherence(agents);
          coherenceData.push(coherence);

          var avgDist = calcAvgDistToLight(agents);
          avgDistData.push(avgDist);

          r_ai_data.push(controls.r_illuminated/controls.unit);
          r_as_data.push(controls.r_shadowed/controls.unit);

          step_data.push(counter);
        }

        if (step % 1000 == 0) {
          console.log(`   ${step} done.`)
        }
        counter++;
      }

      console.log(`Setting r_ai: ${r_ai}, r_as: ${r_as} done.`)
    }
  }


console.log(">>> All work done! Download now on the button.")
}