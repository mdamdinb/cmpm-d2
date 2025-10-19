import "./style.css";

document.body.innerHTML = `
  <h1>D2 Assignment</h1>
  <canvas id="myCanvas" width="256" height="256"></canvas>
  <button id = "clrButton">clear</button>
  
`;

const myCanvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = myCanvas.getContext("2d")!;
const clrButton = document.getElementById("clrButton") as HTMLButtonElement;

interface Point {
  x: number;
  y: number;
}

type Stroke = Point[];
const strokes: Stroke[] = [];
let currentStroke: Stroke | null = null;

clrButton.addEventListener("click", () => {
  strokes.length = 0; //clears the data
  dispatchDrawingChanged(); //triggers redraw
});

myCanvas.addEventListener("mousedown", (e) => {
  currentStroke = [{ x: e.offsetX, y: e.offsetY }];
  strokes.push(currentStroke);
  dispatchDrawingChanged();
});

myCanvas.addEventListener("mousemove", (e) => {
  if (currentStroke) {
    currentStroke.push({ x: e.offsetX, y: e.offsetY }); //stores point
    dispatchDrawingChanged();
  }
});

myCanvas.addEventListener("mouseup", () => {
  currentStroke = null;
});

// Custom event dispatch
function dispatchDrawingChanged() {
  const event = new CustomEvent("drawing-changed");
  myCanvas.dispatchEvent(event);
}

// Observer for drawing changes
myCanvas.addEventListener("drawing-changed", () => {
  redrawCanvas();
});

function redrawCanvas() {
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
  
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  
  for (const stroke of strokes) {
    if (stroke.length < 2) continue;
    
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    
    ctx.stroke();
  }
}
