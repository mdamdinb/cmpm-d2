import "./style.css";

document.body.innerHTML = `
  <h1>D2 Assignment</h1>
  <canvas id="myCanvas" width="256" height="256"></canvas>
  <div>
    <button id="thinButton" class="selectedTool">Thin Marker</button>
    <button id="thickButton">Thick Marker</button>
  </div>
  <div id="stickerContainer">
  </div>
  <div>
    <button id="customStickerButton">Custom Sticker</button>
  </div>
  <div> 
    <button id= "clrButton">clear</button>
    <button id="undoButton">undo</button>
    <button id="redoButton">redo</button>
  </div>
  <div>
    <button id="exportButton">export</button>
  </div>
`;

const myCanvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = myCanvas.getContext("2d")!;
const thinButton = document.getElementById("thinButton") as HTMLButtonElement;
const thickButton = document.getElementById("thickButton") as HTMLButtonElement;
const clrButton = document.getElementById("clrButton") as HTMLButtonElement;
const undoButton = document.getElementById("undoButton") as HTMLButtonElement;
const redoButton = document.getElementById("redoButton") as HTMLButtonElement;
const customStickerButton = document.getElementById(
  "customStickerButton",
) as HTMLButtonElement;
const stickerContainer = document.getElementById(
  "stickerContainer",
) as HTMLButtonElement;
const exportButton = document.getElementById(
  "exportButton",
) as HTMLButtonElement;

interface Command {
  execute(ctx: CanvasRenderingContext2D): void;
}

interface DrawableCommand extends Command {
  drag(x: number, y: number): void;
}

class MarkerLine implements DrawableCommand {
  private points: { x: number; y: number }[];
  private thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.points = [{ x, y }];
    this.thickness = thickness;
  }

  drag(x: number, y: number): void {
    this.points.push({ x, y });
  }

  execute(ctx: CanvasRenderingContext2D): void {
    if (this.points.length > 1) {
      ctx.lineWidth = this.thickness;
      ctx.beginPath();
      const { x, y } = this.points[0]!;
      ctx.moveTo(x, y);
      for (const point of this.points) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }
  }
}
class ToolPreview implements Command {
  private x: number;
  private y: number;
  private thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  execute(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

class Sticker implements DrawableCommand {
  private x: number;
  private y: number;
  private emoji: string;

  constructor(x: number, y: number, emoji: string) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
  }

  drag(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  execute(ctx: CanvasRenderingContext2D): void {
    ctx.font = "32px serif";
    ctx.fillText(this.emoji, this.x - 16, this.y + 16);
  }
}

class StickerPreview implements Command {
  private x: number;
  private y: number;
  private emoji: string;

  constructor(x: number, y: number, emoji: string) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
  }

  execute(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = 0.5;
    ctx.font = "32px serif";
    ctx.fillText(this.emoji, this.x - 16, this.y + 16);
    ctx.globalAlpha = 1.0;
  }
}

const commands: Command[] = [];
const redoStack: Command[] = [];
let currentCommand: DrawableCommand | null = null;
let toolPreview: Command | null = null;
let selectedThickness = 2;
let selectedSticker: string | null = null;

const stickers: string[] = ["🙈", "🙉", "🙊"];

function createStickerButton(emoji: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = emoji;
  button.addEventListener("click", () => {
    selectSticker(emoji, button);
  });
  return button;
}

function selectSticker(emoji: string, button: HTMLButtonElement) {
  selectedSticker = emoji;
  thinButton.classList.remove("selectedTool");
  thickButton.classList.remove("selectedTool");
  const allStickerButtons = stickerContainer.querySelectorAll("button");
  allStickerButtons.forEach((btn) => btn.classList.remove("selectedTool"));
  button.classList.add("selectedTool");
  dispatchToolMoved();
}

function initializeStickerButtons() {
  stickerContainer.innerHTML = "";
  stickers.forEach((emoji) => {
    const button = createStickerButton(emoji);
    stickerContainer.appendChild(button);
  });
}

initializeStickerButtons();

thinButton.addEventListener("click", () => {
  selectedThickness = 2;
  selectedSticker = null;
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
  const allStickerButtons = stickerContainer.querySelectorAll("button");
  allStickerButtons.forEach((btn) => btn.classList.remove("selectedTool"));
});

thickButton.addEventListener("click", () => {
  selectedThickness = 6;
  selectedSticker = null;
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
  const allStickerButtons = stickerContainer.querySelectorAll("button");
  allStickerButtons.forEach((btn) => btn.classList.remove("selectedTool"));
});

customStickerButton.addEventListener("click", () => {
  const customEmoji = prompt("Enter a custom sticker (emoji or text):", "😀");
  if (customEmoji && customEmoji.trim() !== "") {
    stickers.push(customEmoji);
    const button = createStickerButton(customEmoji);
    stickerContainer.appendChild(button);
    selectSticker(customEmoji, button);
  }
});

clrButton.addEventListener("click", () => {
  commands.splice(0, commands.length);
  dispatchDrawingChanged();
});

undoButton.addEventListener("click", () => {
  if (commands.length > 0) {
    redoStack.push(commands.pop()!);
    dispatchDrawingChanged();
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    commands.push(redoStack.pop()!);
    dispatchDrawingChanged();
  }
});

exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;

  exportCtx.scale(4, 4);

  exportCtx.strokeStyle = "black";

  for (const command of commands) {
    command.execute(exportCtx);
  }

  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
});

myCanvas.addEventListener("mousedown", (e) => {
  if (selectedSticker) {
    currentCommand = new Sticker(e.offsetX, e.offsetY, selectedSticker);
  } else {
    currentCommand = new MarkerLine(e.offsetX, e.offsetY, selectedThickness);
  }
  commands.push(currentCommand);
  redoStack.splice(0, redoStack.length); //clear redo stack on new stroke
  toolPreview = null;
  dispatchDrawingChanged();
});

myCanvas.addEventListener("mousemove", (e) => {
  if (currentCommand) {
    currentCommand.drag(e.offsetX, e.offsetY);
    dispatchDrawingChanged();
  } else {
    if (selectedSticker) {
      toolPreview = new StickerPreview(e.offsetX, e.offsetY, selectedSticker);
    } else {
      toolPreview = new ToolPreview(e.offsetX, e.offsetY, selectedThickness);
    }
    dispatchToolMoved();
  }
});

myCanvas.addEventListener("mouseup", () => {
  currentCommand = null;
});

myCanvas.addEventListener("mouseenter", (e) => {
  if (selectedSticker) {
    toolPreview = new StickerPreview(e.offsetX, e.offsetY, selectedSticker);
  } else {
    toolPreview = new ToolPreview(e.offsetX, e.offsetY, selectedThickness);
  }
  dispatchToolMoved();
});

myCanvas.addEventListener("mouseleave", () => {
  toolPreview = null;
  dispatchToolMoved();
});

// Custom event dispatch
function dispatchDrawingChanged() {
  const event = new CustomEvent("drawing-changed");
  myCanvas.dispatchEvent(event);
}

function dispatchToolMoved() {
  const event = new CustomEvent("tool-moved");
  myCanvas.dispatchEvent(event);
}

// Observer for drawing changes
myCanvas.addEventListener("drawing-changed", () => {
  redrawCanvas();
});

myCanvas.addEventListener("tool-moved", () => {
  redrawCanvas();
});

function redrawCanvas() {
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
  ctx.strokeStyle = "black";

  for (const command of commands) {
    command.execute(ctx);
  }

  if (toolPreview) {
    toolPreview.execute(ctx);
  }
}
