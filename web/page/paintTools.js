'use strict';

/* FloodFill function by binarymax : https://github.com/binarymax/floodfill.js/ */
function floodfill(data, x, y, fillcolor, tolerance, width, height) {

  var length = data.length;
  var Q = [];
  var i = (x + y * width) * 4;
  var e = i, w = i, me, mw, w2 = width * 4;

  var targetcolor = [data[i], data[i + 1], data[i + 2], data[i + 3]];

  if (!pixelCompare(i, targetcolor, fillcolor, data, length, tolerance)) { return false; }
  Q.push(i);
  while (Q.length) {
    i = Q.pop();
    if (pixelCompareAndSet(i, targetcolor, fillcolor, data, length, tolerance)) {
      e = i;
      w = i;
      mw = parseInt(i / w2) * w2; //left bound
      me = mw + w2;             //right bound
      while (mw < w && mw < (w -= 4) && pixelCompareAndSet(w, targetcolor, fillcolor, data, length, tolerance)); //go left until edge hit
      while (me > e && me > (e += 4) && pixelCompareAndSet(e, targetcolor, fillcolor, data, length, tolerance)); //go right until edge hit
      for (var j = w + 4; j < e; j += 4) {
        if (j - w2 >= 0 && pixelCompare(j - w2, targetcolor, fillcolor, data, length, tolerance)) Q.push(j - w2); //queue y-1
        if (j + w2 < length && pixelCompare(j + w2, targetcolor, fillcolor, data, length, tolerance)) Q.push(j + w2); //queue y+1
      }
    }
  }
  return data;
};

function pixelCompare(i, targetcolor, fillcolor, data, length, tolerance) {
  if (i < 0 || i >= length) return false; //out of bounds
  if (data[i + 3] === 0 && fillcolor.a > 0) return true;  //surface is invisible and fill is visible

  if (
    Math.abs(targetcolor[3] - fillcolor.a) <= tolerance &&
    Math.abs(targetcolor[0] - fillcolor.r) <= tolerance &&
    Math.abs(targetcolor[1] - fillcolor.g) <= tolerance &&
    Math.abs(targetcolor[2] - fillcolor.b) <= tolerance
  ) return false; //target is same as fill

  if (
    (targetcolor[3] === data[i + 3]) &&
    (targetcolor[0] === data[i]) &&
    (targetcolor[1] === data[i + 1]) &&
    (targetcolor[2] === data[i + 2])
  ) return true; //target matches surface

  if (
    Math.abs(targetcolor[3] - data[i + 3]) <= (255 - tolerance) &&
    Math.abs(targetcolor[0] - data[i]) <= tolerance &&
    Math.abs(targetcolor[1] - data[i + 1]) <= tolerance &&
    Math.abs(targetcolor[2] - data[i + 2]) <= tolerance
  ) return true; //target to surface within tolerance

  return false; //no match
};

function pixelCompareAndSet(i, targetcolor, fillcolor, data, length, tolerance) {
  if (pixelCompare(i, targetcolor, fillcolor, data, length, tolerance)) {
    //fill the color
    data[i] = fillcolor.r;
    data[i + 1] = fillcolor.g;
    data[i + 2] = fillcolor.b;
    data[i + 3] = fillcolor.a;
    return true;
  }
  return false;
};

function fillUint8ClampedArray(data, x, y, color, tolerance, width, height) {
  if (!data instanceof Uint8ClampedArray) throw new Error("data must be an instance of Uint8ClampedArray");
  if (isNaN(width) || width < 1) throw new Error("argument 'width' must be a positive integer");
  if (isNaN(height) || height < 1) throw new Error("argument 'height' must be a positive integer");
  if (isNaN(x) || x < 0) throw new Error("argument 'x' must be a positive integer");
  if (isNaN(y) || y < 0) throw new Error("argument 'y' must be a positive integer");
  if (width * height * 4 !== data.length) throw new Error("width and height do not fit Uint8ClampedArray dimensions");

  var xi = Math.floor(x);
  var yi = Math.floor(y);

  if (xi !== x) console.warn("x truncated from", x, "to", xi);
  if (yi !== y) console.warn("y truncated from", y, "to", yi);

  //Maximum tolerance of 254, Default to 0
  tolerance = (!isNaN(tolerance)) ? Math.min(Math.abs(Math.round(tolerance)), 254) : 0;

  return floodfill(data, xi, yi, color, tolerance, width, height);
};

var getComputedColor = function (c) {
  var temp = document.createElement("div");
  var color = { r: 0, g: 0, b: 0, a: 0 };
  temp.style.color = c;
  temp.style.display = "none";
  document.body.appendChild(temp);
  //Use native window.getComputedStyle to parse any CSS color pattern
  var style = window.getComputedStyle(temp, null).color;
  document.body.removeChild(temp);

  var recol = /([\.\d]+)/g;
  var vals = style.match(recol);
  if (vals && vals.length > 2) {
    //Coerce the string value into an rgba object
    color.r = parseInt(vals[0]) || 0;
    color.g = parseInt(vals[1]) || 0;
    color.b = parseInt(vals[2]) || 0;
    color.a = Math.round((parseFloat(vals[3]) || 1.0) * 255);
  }
  return color;
};

function fillContext(x, y, tolerance, left, top, right, bottom) {
  var ctx = this;

  //Gets the rgba color from the context fillStyle
  var color = getComputedColor(this.fillStyle);

  //Defaults and type checks for image boundaries
  left = (isNaN(left)) ? 0 : left;
  top = (isNaN(top)) ? 0 : top;
  right = (!isNaN(right) && right) ? Math.min(Math.abs(right), ctx.canvas.width) : ctx.canvas.width;
  bottom = (!isNaN(bottom) && bottom) ? Math.min(Math.abs(bottom), ctx.canvas.height) : ctx.canvas.height;

  var image = ctx.getImageData(left, top, right, bottom);

  var data = image.data;
  var width = image.width;
  var height = image.height;

  if (width > 0 && height > 0) {
    fillUint8ClampedArray(data, x, y, color, tolerance, width, height);
    ctx.putImageData(image, left, top);
  }
};

if (typeof CanvasRenderingContext2D != 'undefined') {
  CanvasRenderingContext2D.prototype.fillFlood = fillContext;
};
/* end FloodFill */

function convertCoordsFromPicToUI(x, y, pic) {
  const picRect = pic.element.getBoundingClientRect();
  const workspaceRect = document.getElementById('workspace').getBoundingClientRect();

  // Scale the point
  const scaledX = x * pic.scale;
  const scaledY = y * pic.scale;

  // Translate the point based on the pic's position in the workspace
  const uiX = picRect.left - workspaceRect.left + scaledX;
  const uiY = picRect.top - workspaceRect.top + scaledY;

  return { x: uiX, y: uiY };
}

function convertCoordsFromUIToPic(x, y, pic) {
  const picRect = pic.element.getBoundingClientRect();
  const workspaceRect = document.getElementById('workspace').getBoundingClientRect();

  // Translate the point to the pic's coordinate system
  const picX = x - (picRect.left - workspaceRect.left);
  const picY = y - (picRect.top - workspaceRect.top);

  // Scale the point based on the pic's scale
  const scaledX = picX / pic.scale;
  const scaledY = picY / pic.scale;

  return { x: scaledX, y: scaledY };
}


function initUICanvas() {
  const uiCanvas = document.createElement('canvas');
  uiCanvas.id = 'uiCanvas';
  uiCanvas.style.position = 'absolute';
  uiCanvas.style.left = '0';
  uiCanvas.style.top = '0';
  uiCanvas.style.zIndex = '101'; // Ensure it's above other elements

  const workspace = document.getElementById('workspace');
  workspace.appendChild(uiCanvas);

  const resizeCanvas = () => {
    uiCanvas.width = workspace.clientWidth;
    uiCanvas.height = workspace.clientHeight;
  };

  // Initial resize
  resizeCanvas();

  // Resize canvas when window resizes
  window.addEventListener('resize', resizeCanvas);

  uiCanvas.addEventListener('mousedown', (event) => handleMouseEvent(event, 'mousedown'));
  uiCanvas.addEventListener('mouseup', (event) => handleMouseEvent(event, 'mouseup'));
  uiCanvas.addEventListener('mousemove', (event) => handleMouseEvent(event, 'mousemove'));
  uiCanvas.addEventListener('contextmenu', (event) => event.preventDefault());

  function handleMouseEvent(event, eventType) {
    if (tool.eventHandlers) {
      if ((event.buttons & 4) == 4) {
        passEventToElementBelow(event);
      } else {
        if (tool.eventHandlers[eventType]) {
          // Call the tool's event handler
          tool.eventHandlers[eventType](event);
        }
      }

    } else {
      // Pass the event to the element below
      passEventToElementBelow(event);
    }
    event.preventDefault();

  }

  function passEventToElementBelow(event) {
    uiCanvas.style.pointerEvents = 'none';

    // Find the element below the cursor
    let elemBelow = document.elementFromPoint(event.clientX, event.clientY);

    uiCanvas.style.pointerEvents = '';

    // Dispatch the event to the element below
    if (elemBelow) {
      forwardEvent(event, elemBelow);
    }
  }

  return uiCanvas;
}

function drawPicFramesOnUICanvas(uiCanvas, picList) {
  const ctx = uiCanvas.getContext('2d');
  ctx.clearRect(0, 0, uiCanvas.width, uiCanvas.height); // Clear the canvas

  picList.forEach(pic => {
    // Convert pic's corners to UI Canvas coordinates
    const topLeft = convertCoordsFromPicToUI(0, 0, pic);
    const topRight = convertCoordsFromPicToUI(pic.width, 0, pic);
    const bottomLeft = convertCoordsFromPicToUI(0, pic.height, pic);
    const bottomRight = convertCoordsFromPicToUI(pic.width, pic.height, pic);

    // Draw rectangle
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.lineTo(topLeft.x, topLeft.y);
    ctx.strokeStyle = 'red';
    ctx.stroke();

    // Draw cross lines
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.moveTo(topRight.x, topRight.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.stroke();
  });
}

function bline(ctx, x0, y0, x1, y1) {
  x0 = Math.round(x0);
  x1 = Math.round(x1);
  y0 = Math.round(y0);
  y1 = Math.round(y1);

  if (x0 === x1 && y0 === y1){
    ctx.fillRect( x0, y0, 1, 1 );
    return;
  }

  var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  var dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1; 
  var err = (dx>dy ? dx : -dy)/2;        
  while (true) {
    ctx.fillRect( x0, y0, 1, 1 );
    if (x0 === x1 && y0 === y1) break;
    var e2 = err;
    if (e2 > -dx) { err -= dy; x0 += sx; }
    if (e2 < dy) { err += dx; y0 += sy; }
  }
}

const brushCanvas = document.createElement("canvas");
brushCanvas.height = 2;
brushCanvas.height = 2;
brushCanvas.ctx = brushCanvas.getContext("2d",{willReadFrequently:true});

const pixelTip = {
  drawOperation(ctx, toolInfo, strokePath) {

    brushCanvas.width = ctx.canvas.width;
    brushCanvas.height = ctx.canvas.height;
    brushCanvas.ctx.clearRect(0, 0, brushCanvas.width, brushCanvas.height);

    if(toolInfo.size/2 > 1){
      brushCanvas.ctx.lineWidth = toolInfo.size;
      brushCanvas.ctx.strokeStyle = toolInfo.colour;
      brushCanvas.ctx.lineCap = "round";
      brushCanvas.ctx.lineJoin = "round";
      brushCanvas.ctx.beginPath();
      for (let { x, y } of strokePath) {
        brushCanvas.ctx.lineTo(x, y);
      }
      brushCanvas.ctx.stroke();
    }
    else{
      ctx.fillStyle = toolInfo.colour;
      let { x, y } = strokePath.at(0);
      let x2 = x;
      let y2 = y;
      for ({ x, y } of strokePath) {
        bline(ctx,x,y,x2,y2);
        x2 = x;
        y2 = y;
      }
    }

    const imgData = brushCanvas.ctx.getImageData(0, 0, brushCanvas.width, brushCanvas.height);
    const data = imgData.data;

    for(let i = 0; i < data.length; i += 4) {
      if(data[i+3] > 0)
        data[i+3] = 255;
    }

    brushCanvas.ctx.putImageData(imgData, 0, 0);

    ctx.drawImage(brushCanvas,0,0);
    
  },
  cursorFunction: circleBrush
}

const eyeDropper = {
  drawOperation(ctx, toolInfo, strokePath) {
    const last = strokePath.at(-1);
    let { x, y } = last;
    x = Math.floor(x - 0.25);
    y = Math.floor(y - 0.25);
    let canvas = ctx.canvas;
    if (x >= 0 && y >= 0 && x < canvas.width && y < canvas.height) {
      const sample = activePic.canvas.ctx.getImageData(x, y, 1, 1).data;
      const toHex = (byte) => byte.toString(16).padStart(2, '0');
      const color = "#" + toHex(sample[0]) + toHex(sample[1]) + toHex(sample[2]);
      $("#foreground").val(color)
    }
  },
  eventHandlers: {
    mousedown(e) {
      const { offsetX, offsetY } = e;
      const pic = getDrawAreaAtPoint(offsetX, offsetY);

      if (!pic) return;
      const { x, y } = convertCoordsFromUIToPic(offsetX, offsetY, pic);
      if (x >= 0 && y >= 0 && x < pic.width && y < pic.height) {
        const sample = pic.canvas.ctx.getImageData(x, y, 1, 1).data;
        const toHex = (byte) => byte.toString(16).padStart(2, '0');
        const color = "#" + toHex(sample[0]) + toHex(sample[1]) + toHex(sample[2]);
        $("#foreground").val(color)
      }
      console.log({ x, y })
    }
  }
}

const feltTip = {
  drawOperation(ctx, toolInfo, strokePath) {
    ctx.lineWidth = toolInfo.size;
    ctx.strokeStyle = "#000";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = toolInfo.colour;
    ctx.shadowOffsetX = ctx.canvas.width * 2;
    ctx.shadowOffsetY = 0;

    var hardness = 1.0 - (toolInfo.hardness / 100.0);
    ctx.shadowBlur = hardness * toolInfo.size;
    ctx.beginPath();
    for (let { x, y } of strokePath) {
      ctx.lineTo(x - ctx.canvas.width * 2, y);
    }
    ctx.stroke();
  },
  cursorFunction: circleBrush
}


const eraserTip = {
  drawOperation(ctx, toolInfo, strokePath) {
    ctx.save();

    ctx.lineWidth = toolInfo.size;
    ctx.strokeStyle = "#000";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "white";
    ctx.shadowOffsetX = ctx.canvas.width * 2;
    ctx.shadowOffsetY = 0;

    var hardness = 1.0 - (toolInfo.hardness / 100.0);
    ctx.shadowBlur = hardness * toolInfo.size;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    for (let { x, y } of strokePath) {
      ctx.lineTo(x - ctx.canvas.width * 2, y);
    }
    ctx.stroke();
    ctx.restore();
  },
  cursorFunction: circleBrush
}


const pixelClear = {
  drawOperation(ctx, toolInfo, strokePath) {
    brushCanvas.width = ctx.canvas.width;
    brushCanvas.height = ctx.canvas.height;
    brushCanvas.ctx.clearRect(0, 0, brushCanvas.width, brushCanvas.height);

    if(toolInfo.size > 1){
      brushCanvas.ctx.lineWidth = toolInfo.size;
      brushCanvas.ctx.strokeStyle = "#000";
      brushCanvas.ctx.lineCap = "round";
      brushCanvas.ctx.lineJoin = "round";

      brushCanvas.ctx.beginPath();
      for (let { x, y } of strokePath) {
        brushCanvas.ctx.lineTo(x, y);
      }
      brushCanvas.ctx.stroke();
    }
    else{
      ctx.fillStyle = "#000";
      let { x, y } = strokePath.at(0);
      let x2 = x;
      let y2 = y;
      for ({ x, y } of strokePath) {
        bline(ctx,x,y,x2,y2);
        x2 = x;
        y2 = y;
      }
    }

    const imgData = brushCanvas.ctx.getImageData(0, 0, brushCanvas.width, brushCanvas.height);
    const data = imgData.data;

    for(let i = 0; i < data.length; i += 4) {
      if(data[i+3] > 0)
        data[i+3] = 255;
    }

    brushCanvas.ctx.putImageData(imgData, 0, 0);

    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(brushCanvas,0,0);
  },
  cursorFunction: circleBrush
}

const floodFill = {
  drawOperation(ctx, toolInfo, strokePath) {
    const last = strokePath.at(-1);
    let { x, y } = last;
    x = Math.floor(x - 0.25);
    y = Math.floor(y - 0.25);

    ctx.fillStyle = toolInfo.colour;
    ctx.fillFlood(x,y,toolInfo.threshold);

  }
}


const transformTool = (_ => {  //closure
  let rotateMode = false;
  let doubleClickGap = 300;
  let mouseDownTime = 0;
  let mouseDownTransform = [1, 0, 0, 1, 0, 0];
  let mouseDownAngle = 0;
  let layer;
  let dragHandler;
  let mouseDownPosition
  let preserveAspect = false;
  let moved = false;
  let scaleHandlers = [
    dragTopLeft, dragTopRight, dragBottomRight, dragBottomLeft, dragTop, dragRight, dragBottom, dragLeft
  ];


  const tool = {
    init() {
      rotateMode = false;
      this.drawUI();
    },
    drawOperation() {
      console.log("transform tool should not draw, this is a bug")
    },
    drawUI() {
      //drawPicFramesOnUICanvas(uiCanvas,[activePic]);
      const ctx = uiCanvas.getContext("2d");
      ctx.clearRect(0, 0, 1e5, 1e5);
      let handles = controlPoints(0, 0, activePic.activeLayer.width, activePic.activeLayer.height);
      ctx.fillStyle = "black";
      ctx.strokeStyle = "white";


      if (rotateMode) {
        let { x, y } = activePic.activeLayer.rotationCenter;
        const picPoints = activePic.activeLayer.convertToPicCoords(x, y)
        const uiPos = convertCoordsFromPicToUI(picPoints.x, picPoints.y, activePic);
        ctx.strokeStyle = "black";
        ctx.strokeRect(uiPos.x - 5, uiPos.y - 5, 10, 10);
        ctx.strokeStyle = "white";
        ctx.strokeRect(uiPos.x - 4, uiPos.y - 4, 8, 8);
        for (let { x, y } of handles) {
          const picPoints = activePic.activeLayer.convertToPicCoords(x, y)
          const uiPos = convertCoordsFromPicToUI(picPoints.x, picPoints.y, activePic);
          ctx.beginPath();
          ctx.arc(uiPos.x, uiPos.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(uiPos.x, uiPos.y, 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        for (let { x, y } of handles) {
          const picPoints = activePic.activeLayer.convertToPicCoords(x, y)
          const uiPos = convertCoordsFromPicToUI(picPoints.x, picPoints.y, activePic);
          ctx.fillRect(uiPos.x - 5, uiPos.y - 5, 10, 10);
          ctx.strokeRect(uiPos.x - 4, uiPos.y - 4, 8, 8);
        }
      }

    }
  }

  tool.eventHandlers = {
    mousedown(e) {
      if (e.button == 0) {
        let now = Date.now();
        let clickSpacing = now - mouseDownTime;
        mouseDownTime = now;
        if (clickSpacing < doubleClickGap) {
          doubleClickHandler(e);
          return;
        }

        const mousePos = convertCoordsFromUIToPic(e.offsetX, e.offsetY, activePic);
        layer = activePic?.activeLayer;
        if (!layer) return;
        let handles = controlPoints(0, 0, layer.width, layer.height);
        dragHandler = null;
        for (let i = 0; i < handles.length; i++) {
          const { x, y } = handles[i];
          const picPoints = layer.convertToPicCoords(x, y)
          //const uiPos = convertCoordsFromPicToUI(picPoints.x,picPoints.y,activePic);
          //if (max( abs(uiPos.x-e.offsetX), abs(uiPos.y-e.offsetY) ) <8 ) {
          if (max(abs(picPoints.x - mousePos.x), abs(picPoints.y - mousePos.y)) < 8) {
            dragHandler = rotateMode ? rotateHandler : scaleHandlers[i];
            break;
          }
        }
        if (!dragHandler) {
          if (mousePos.x > 0 &&
            mousePos.x <= activePic.width &&
            mousePos.y > 0 &&
            mousePos.y <= activePic.height
          ) {
            dragHandler = translateHandler;
          }
          if (rotateMode) {
            let { x, y } = layer.convertToPicCoords(layer.rotationCenter.x, layer.rotationCenter.y);
            console.log({ x, y, mousePos })
            if (max(abs(x - mousePos.x), abs(y - mousePos.y)) < 8) {
              dragHandler = translateCenterHandler;
            }
          }
        }
        if (dragHandler) {
          let center = layer.convertToPicCoords(layer.rotationCenter.x, layer.rotationCenter.y)
          mouseDownAngle = v2Angle(v2Sub(mousePos, center));
          mouseDownTransform = [...layer.transform];
          mouseDownPosition = { x: e.offsetX, y: e.offsetY }
          console.log({ mouseDownAngle })
          moved = false;

        }
      }
    },
    mouseup(e) {

    },
    mousemove(e) {

      if ((e.buttons && 1) !== 1) dragStop();
      if (dragHandler) {
        if (!moved) {
          activePic.addUndoRecord(layer.undoTransformRecord());
          moved = true;
        }
        dragHandler(e);

      }
      tool.drawUI();

    },
  }

  function controlPoints(left, top, right, bottom) {
    const midX = (left + right) / 2;
    const midY = (top + bottom) / 2;
    return [
      { x: left, y: top },
      { x: right, y: top },
      { x: right, y: bottom },
      { x: left, y: bottom },
      { x: midX, y: top },
      { x: right, y: midY },
      { x: midX, y: bottom },
      { x: left, y: midY }
    ]
  }

  function dragStop() {
    dragHandler = null;
    updateLayerList();
  }

  function doubleClickHandler(e) {
    rotateMode = !rotateMode;
    tool.drawUI();
  }

  function scaleHandler(handle, anchor, position, lockX = false, lockY = false) {
    const newTransform = scaleTransformByHandle(handle, anchor, position, mouseDownTransform, lockX, lockY);

    layer.transform = newTransform;

    activePic.updateVisualRepresentation();

  }

  function translateHandler(e) {
    let dx = e.offsetX - mouseDownPosition.x
    let dy = e.offsetY - mouseDownPosition.y;

    let newTransform = [...mouseDownTransform];
    newTransform[4] += dx;
    newTransform[5] += dy;

    layer.transform = newTransform;
    activePic.updateVisualRepresentation();
  }

  function translateCenterHandler(e) {
    const mousePos = convertCoordsFromUIToPic(e.offsetX, e.offsetY, activePic);
    layer.rotationCenter = layer.convertFromPicCoords(mousePos.x, mousePos.y);
    activePic.updateVisualRepresentation();

  }

  function dragTopLeft(e) {
    const mouseCurrentPosition = convertCoordsFromUIToPic(e.offsetX, e.offsetY, activePic);
    scaleHandler({ x: 0, y: 0 }, { x: layer.width, y: layer.height }, mouseCurrentPosition);
  }


  function dragTopRight(e) {
    const mouseCurrentPosition = convertCoordsFromUIToPic(e.offsetX, e.offsetY, activePic);
    scaleHandler({ x: layer.width, y: 0 }, { x: 0, y: layer.height }, mouseCurrentPosition);

  }
  function dragBottomRight(e) {
    const mouseCurrentPosition = convertCoordsFromUIToPic(e.offsetX, e.offsetY, activePic);
    scaleHandler({ x: layer.width, y: layer.height }, { x: 0, y: 0 }, mouseCurrentPosition);
  }
  function dragBottomLeft(e) {
    const mouseCurrentPosition = convertCoordsFromUIToPic(e.offsetX, e.offsetY, activePic);
    scaleHandler({ x: 0, y: layer.height }, { x: layer.width, y: 0 }, mouseCurrentPosition);
  }
  function dragTop(e) {
    const mouseCurrentPosition = convertCoordsFromUIToPic(e.offsetX, e.offsetY, activePic);
    scaleHandler({ x: layer.width / 2, y: 0 }, { x: layer.width, y: layer.height }, mouseCurrentPosition, true);
  }
  function dragRight(e) {
    const mouseCurrentPosition = convertCoordsFromUIToPic(e.offsetX, e.offsetY, activePic);
    scaleHandler({ x: layer.width, y: layer.height / 2 }, { x: 0, y: 0 }, mouseCurrentPosition, false, true);
  }
  function dragLeft(e) {
    const mouseCurrentPosition = convertCoordsFromUIToPic(e.offsetX, e.offsetY, activePic);
    scaleHandler({ x: 0, y: layer.height / 2 }, { x: layer.width, y: 0 }, mouseCurrentPosition, false, true);

  }
  function dragBottom(e) {
    const mouseCurrentPosition = convertCoordsFromUIToPic(e.offsetX, e.offsetY, activePic);
    scaleHandler({ x: layer.width / 2, y: layer.height }, { x: layer.width, y: 0 }, mouseCurrentPosition, true);
  }

  function rotateHandler(e) {
    let center = layer.convertToPicCoords(layer.rotationCenter.x, layer.rotationCenter.y)
    let mousePos = convertCoordsFromUIToPic(e.offsetX, e.offsetY, activePic);

    let angle = v2Angle(v2Sub(mousePos, center));
    let angleDelta = angle - mouseDownAngle;
    layer.transform = [...mouseDownTransform];
    layer.rotate(angleDelta * RadiansToDegrees);
    activePic.updateVisualRepresentation();
  }



  return tool;
})();  //end closure for transformTool
