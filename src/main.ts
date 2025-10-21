import "./style.css";

document.body.innerHTML = `
  <h1>D2 Assignment</h1>
  <canvas id="myCanvas" width="256" height="256"></canvas>
  <button id = "clrButton">clear</button>
  <button id="undoButton">undo</button>
  <button id="redoButton">redo</button>
  
`;

const myCanvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = myCanvas.getContext("2d")!;
const clrButton = document.getElementById("clrButton") as HTMLButtonElement;
const undoButton = document.getElementById("undoButton") as HTMLButtonElement;
const redoButton = document.getElementById("redoButton") as HTMLButtonElement;

interface Point {
  x: number;
  y: number;
}

type Stroke = Point[];
const strokes: Stroke[] = [];
const redoStack: Stroke[] = [];
let currentStroke: Stroke | null = null;

clrButton.addEventListener("click", () => {
  strokes.splice(0, strokes.length);
  dispatchDrawingChanged();
});

undoButton.addEventListener("click", () => {
  if (strokes.length > 0) {
    redoStack.push(strokes.pop()!);
    dispatchDrawingChanged();
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    strokes.push(redoStack.pop()!);
    dispatchDrawingChanged();
  }
});

myCanvas.addEventListener("mousedown", (e) => {
  currentStroke = [];
  strokes.push(currentStroke);
  redoStack.splice(0, redoStack.length); //clear redo stack on new stroke
  currentStroke.push({ x: e.offsetX, y: e.offsetY });

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
    if (stroke.length > 1) {
      ctx.beginPath();
      const { x, y } = stroke[0]!;
      ctx.moveTo(x, y);

      for (const point of stroke) {
        ctx.lineTo(point.x, point.y);
      }

      ctx.stroke();
    }
  }
}
