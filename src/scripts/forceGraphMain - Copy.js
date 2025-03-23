import ForceGraph from 'force-graph';
//import csv from 'csv-parser';
import fs from 'fs';

import {getStore} from '@netlify/blobs';


import Papa from 'papaparse';



const nodesDefaultFileURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT44LIJcU-cT8F4PRowSEaSsyDufhcYATBpHAkjsyqtpzFutwBJeVKQWAVTB_tiQ3PUm0N-GHrxgjbG/pub?gid=0&single=true&output=csv";
const linksDefaultFileURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlCIn7nwlbCTS3bXrJeeYCe6dH4wGOg2tyaueM9AoCW38TM3Tq_OfdjAxbZhWJPwEA_CWPcirNE6ZN/pub?gid=0&single=true&output=csv" 

document.getElementById("NodeSearchField").addEventListener("change", searchForNode);
const Graph = new ForceGraph(document.getElementById('graph'));

//Default node size, to be scaled with individual node multiplier
const dfNodeSize = 30;

let showNodeLabel = true;
let editMode = false;
let newNodeIdCounter = 0;
let interimLink = null;
let selectedLink = null;

//const nodesFileData = "../scripts/csvparser.js"; 

// const graphData_Base.nodes = Papa.parse(defaultNodesData,{header: true}).data;

let graphData_Base = {nodes:[],links:[]};
let nodesByName = [];
let highlightedNodes = new Set();
let highlightedLinks = new Set();

function searchForNode(event){
  const searchedNode = nodesByName[event.target.value];
 if(!searchedNode) {alert(`Could not find node ${event.target.value}`); return;}
  Graph.centerAt(searchedNode.x, searchedNode.y, 1000);
  Graph.zoom(3,1000);
  nodeHoverFn(searchedNode, null);

}


function setNodeByNameArray (){
  //Makes array of pairs from nodes data and converts it to one object with names as keys
  nodesByName = Object.fromEntries(graphData_Base.nodes.map(node => [node.Name, node]));
  //defines childLinks array in every node to use Array.push() for linkes
  //for (const [name, node] of Object.entries(nodesByName)){node.childLinks = [];}
  ////Assigns every link to it's source node
  //graphData_Base.links.forEach(link => {
  //  nodesByName[link.Source].childLinks.push(link);
  //})
}

function setNodeArrays(){
  graphData_Base.nodes.forEach((node) => {
    if(node.childLinks){node.childLinks.length = 0}
    else{node.childLinks = [];}
    if(node.parentLinks){node.parentLinks.length = 0}
    else{node.parentLinks = [];}
    if(!node.BorderColor){node.BorderColor="#A9A9A9";}
  });
  graphData_Base.links.forEach(link => {
    if(!link.Color){link.Color="#A9A9A9"}
    try{
      //console.log(nodesByName[link.Target]);
    nodesByName[link.Source].childLinks.push(link);
    nodesByName[link.Target].parentLinks.push(link);
    }
    catch(err){console.log(link);console.log(err);}
  });
}

function getVisibleData (){
  const visibleNodes = [];
  const visibleLinks = [];

  graphData_Base.nodes.forEach((node) => {
    if(node.hidden == null || !node.hidden) {
      visibleNodes.push(node);
      node.childLinks.forEach((link) => {
        if(!nodesByName[link.Target].hidden){visibleLinks.push(link)};
        })
      }
    })
    //(If node is hidden, it's links aren't pushed either)
  return {nodes: visibleNodes, links: visibleLinks};
}

//Copy pasted const function
const updateGraphData = () => {
  setNodeByNameArray();
  setNodeArrays();
  makeNodeImages();
  Graph.graphData(getVisibleData());

  const nodeSearchFieldDatalistElement = document.getElementById("NodeSearchFieldDatalist");
  for(const [i, node] of Graph.graphData().nodes.entries()){
    const option = document.createElement("option");
    option.value = node.Name;
    nodeSearchFieldDatalistElement.appendChild(option);
  }
  

  console.log("graph updated"); 
  console.log("nodes:");
  console.log(graphData_Base.nodes);console.log(graphData_Base.links);
  };




function makeOneNodeImage(i){
  const img = new Image();
  img.onLoad = new function (){
    if(graphData_Base.nodes[i].nodeImage) {graphData_Base.nodes[i].nodeImage = null;}
    graphData_Base.nodes[i].nodeImage = img;

    // console.log(`${data.graphData_Base.nodes[i].Name} is loaded`);
  }
  if(graphData_Base.nodes[i].Image){
    img.src = graphData_Base.nodes[i].Image;
  }
  else{
    img.src = "/favicon.png";
  }
  //console.log(graphData_Base.nodes[i].Image) 

  // img.style.borderRadius = "100%";

  // return;
}

function makeNodeImages() {
//Populating node objects with Image object, setting source
  for (let i = 0; i < graphData_Base.nodes.length; i++) {
    makeOneNodeImage(i);
  };


}

function parseAndLoadData(setNodesPath,setLinksPath){
  let nodesPath = "";
  let linksPath = "";
  
  if(setNodesPath && setLinksPath){nodesPath=setNodesPath;linksPath=setLinksPath;}
  else{
    //nodesPath = document.getElementById("NodeUploadInput").Value;
    //linksPath = document.getElementById("LinkUploadInput").Value;
  }

  Papa.parse(nodesPath,
    {header: true,
      download: true, 
      complete: function(results, file) {graphData_Base.nodes = results.data;  if(graphData_Base.links.length != 0){ updateGraphData();} }
    });


  Papa.parse(linksPath,
    {header: true,
      download: true, 
      complete: function(results, file) {graphData_Base.links = results.data; if(graphData_Base.nodes.length != 0){updateGraphData();} }
    });

} 

const docsURLData = document.getElementById("DocsInfoHolderElement").innerHTML.split('/');
//parseAndLoadData(`https://docs.google.com/spreadsheets/d/e/${docsURLData[0]}/pub?gid=${docsURLData[1]}&single=true&output=csv`, 
//                 `https://docs.google.com/spreadsheets/d/e/${docsURLData[0]}/pub?gid=${docsURLData[2]}&single=true&output=csv`);

  import vtubersJSON from "../data/graphs/vtubers.json";

if(docsURLData[0] == "vtubers"){
  graphData_Base = vtubersJSON;
}
else{
  const nodeURL = `https://docs.google.com/spreadsheets/d/e/${docsURLData[0]}/pub?gid=${docsURLData[1]}&single=true&output=csv`;
  const linkURL = `https://docs.google.com/spreadsheets/d/e/${docsURLData[0]}/pub?gid=${docsURLData[2]}&single=true&output=csv`;
console.log(nodeURL);
  parseAndLoadData(nodeURL, linkURL);
}
//parseAndLoadData(nodesDefaultFileURL, linksDefaultFileURL);

//***************************************************************************************************************************************
//										Main graph settings
//***************************************************************************************************************************************


Graph
//Needs to keep redrawing for hover window hitbox?
.autoPauseRedraw(false)
// .linkDirectionalParticles(2)
.height(document.getElementById("GraphContainer").clientHeight)
.nodeId('Name')
.linkSource('Source')
.linkTarget('Target')
//nodeCanvasObject passes node in callback, passing node object					//Arrow funciton???
.nodeCanvasObject((node, ctx) => paintNodeCircle(node, ctx, dfNodeSize))


.nodePointerAreaPaint((node, color, ctx) => {
  // if(node.Name == "Nagase Yuka"){console.log(node);}
  
  const nodeSize = node.Size * dfNodeSize;

  if (!node.nodeWindowOpen){
    ctx.fillStyle = color;
    ctx.fillRect(node.x - nodeSize / 2, node.y - nodeSize / 2, nodeSize, nodeSize); // draw square as pointer trap
  }
  else {
    ctx.fillStyle = color;
    ctx.fillRect(node.x - nodeSize / 2, node.y - nodeSize / 2, nodeSize, nodeSize); 
    //Adding Hover Window to hitbox
    ctx.fillRect(node.hwX, node.hwY, node.hwWidth, node.hwHeight);
    //fill in gap between node and hover window
    ctx.fillRect(node.x, node.y-nodeSize/2, node.hwX - node.x, nodeSize*2);
  }
})
.onNodeHover((node, prevNode) => nodeHoverFn(node, prevNode))
.onNodeDrag((node, translate) => nodeDragFn(node, translate))
.onNodeDragEnd((node) => nodeDragEndFn(node))
.onNodeClick((node) => nodeClickFn(node))
.onNodeRightClick((node) => pinNode(node))
.onBackgroundClick((event) => backgroundClickFn(event))
.linkWidth(2)
.linkDirectionalArrowLength((cLink) => {
  if(cLink.Style == "arrow"){
    return 5;
  }
})
.linkDirectionalArrowRelPos(0.8)
.linkLineDash((cLink) => {
    if(cLink.Style == "dash")
        return [4, 3];
    })
.linkColor((cLink) => {
    if (cLink.hovering || cLink === interimLink || highlightedLinks.has(cLink)){return "Orange";}
    return cLink.Color;
})
.linkCanvasObjectMode(() => 'after')
.linkCanvasObject((link, ctx) => drawLinkCanvasObject(link, ctx))
.onLinkHover((link, prevLink) => checkLinkHover(link, prevLink))
.onLinkClick((link, event) => linkClickFn(link, event))
.linkHoverPrecision(8)
.linkDirectionalParticles(4)
.linkDirectionalParticleWidth((link) => {
    if(highlightedLinks.has(link) || link.hovering ) return 4;
  })
.linkDirectionalParticleSpeed(0.005)
.onBackgroundRightClick((event) => {

  })
;

Graph.d3Force('link').distance(link => nodeDistanceFunction(link));
Graph.d3Force('charge').distanceMax(200);
Graph.d3Force('center').strength(0.5);

updateGraphData();

	
//***************************************************************************************************************************************
//										Main graph settings
//***************************************************************************************************************************************
	




function paintNodeCircle(node, ctx, dfNodeSize){
	//Circle image from https://stackoverflow.com/questions/4276048/html5-canvas-fill-circle-with-image
	//Fit + preserve ascpect ratio from https://stackoverflow.com/questions/23104582/scaling-an-image-to-fit-on-canvas
	// drawImage reference https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
	//context.arc(x, y, r, sAngle, eAngle, counterclockwisebool)
	//context.drawImage(img, x, y, width, height)/context.drawImage(img, sx, sy, swidth, sheight, x, y, width, height)
	
	
  const { nodeImage, x, y, Name,  imdefined,hwX,hwY,hwWidth,hwHeight, nodeWindowOpen, index,  Size, Shape, BorderColor} = node;	
	const nodeSize = Size * dfNodeSize;
  // console.log(`${Name}: ${Size}`)
	

	//Find larger side to fit image to (Same ratio to preserve aspect ratio)
	const ratio  = Math.min ( nodeSize / nodeImage.width, 
							nodeSize / nodeImage.height);
	const widthScaled = nodeImage.width*ratio;
	const heightScaled = nodeImage.height*ratio;
	const centerShift_x = ( nodeSize - widthScaled) / 2;
	const centerShift_y = ( nodeSize - heightScaled) / 2;   
	const textTopPadding = 3;
	const textSidePadding = 8;
	const textRectPadding = 1.5;
	const textRectHeight = 8;
	const ftSize = 6;



  //console.log(Graph.graphData().links);



if(showNodeLabel || highlightedNodes.has(node)){
    ctx.textAlign = "center";
    ctx.font = `${ftSize}px Tahoma`;
    ctx.fillStyle = "#ebebeb";
    ctx.fillRect(x - (ctx.measureText(Name).width / 2) - textRectPadding, 
                                y + (nodeSize / 2) + textTopPadding - 1,
                                ctx.measureText(Name).width + textRectPadding * 2,
                                textRectHeight);
    ctx.fillStyle = "Black";
    ctx.textBaseline = "top";
    ctx.fillText(Name, x, y + nodeSize / 2 + textTopPadding/*, nodeSize + textSidePadding*/);

        
} 
	//***Spill text to nect line with ctx.measureWidth conditional + fillText([maxWidth]) parameter
  //Add node name text + background
	
	//check hitbox
  // if(Name == "Nagase Yuka"){console.log("fill hover check: " + nodeWindowOpen + "\n hwX: " + hwX + "\n hwY: " + hwY + "\n node x: " + x + "\n node y: " + y + "\n hwWidth: " + hwWidth + "\n hwHeight: " + hwHeight);}
//	if(nodeWindowOpen){
//		ctx.fillStyle = "Red";
//		ctx.fillRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize); 
//		ctx.fillRect(hwX, hwY, hwWidth, hwHeight);
//		//fill in gap between node and hover window
//		ctx.fillRect(x, y-nodeSize/2,  hwX - x, nodeSize*2);
//	}

  if(!Shape || Shape == "circle"){
  //Circle path
    ctx.save();  //*????
    ctx.beginPath();
    ctx.arc(x, y, nodeSize/2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
	 //background
    ctx.fillStyle = "White";
    ctx.fill();
  }
  else if(Shape == "square"){
    ctx.save();
    ctx.fillStyle = "White";
    ctx.fillRect(x-nodeSize/2, y-nodeSize/2, nodeSize,nodeSize);
  }
  else if(Shape == "diamond"){
    ctx.save();
    ctx.fillStyle = "White";
    ctx.translate(x,y);
    ctx.rotate(Math.PI/4);
    ctx.fillRect(0-nodeSize/2, 0-nodeSize/2, nodeSize,nodeSize)
    ctx.restore();
  }

	//***Add custom shift in nodes data /**Add fit/fill/stretch options
	//Circle image
  //console.log("Drawing " + Name);
  try{
	if(Shape != "diamond"){
    ctx.drawImage(nodeImage, 0, 0, nodeImage.width, nodeImage.height, 
					(x - nodeSize/2) + centerShift_x, (y - nodeSize/2) + centerShift_y, widthScaled, heightScaled);
    }
    else{
      ctx.translate(x,y);
      ctx.rotate(Math.PI/4);
      ctx.rect(0-nodeSize/2, 0-nodeSize/2, nodeSize,nodeSize);
      ctx.clip();
      ctx.rotate(-Math.PI/4);
      ctx.drawImage(nodeImage, 0, 0, nodeImage.width, nodeImage.height, 
        (0 - nodeSize/2) + centerShift_x, (0 - nodeSize/2) + centerShift_y, widthScaled, heightScaled);
    }
  }
  catch (err){//console.log(`For ${Name}:` + err);
          }

  if(highlightedNodes.has(node)){
    ctx.strokeStyle = "Orange";
  }
  else{
    ctx.strokeStyle = BorderColor ? BorderColor : "DarkGray";
  }
	ctx.lineWidth = 3;
  if(!Shape || Shape == "circle"){
	//Circle outline
    ctx.stroke();
  }	
  else if(Shape == "square"){
    ctx.lineWidth = ctx.lineWidth/2;
    ctx.strokeRect(x-nodeSize/2, y-nodeSize/2, nodeSize,nodeSize);
  }
  else if(Shape == "diamond"){
    //.transform not restored because of .clip
    ctx.rotate(Math.PI/4);
    ctx.strokeRect(0-nodeSize/2, 0-nodeSize/2, nodeSize,nodeSize);
  }	
	return;
}

function nodeHoverFn(node, prevNode){
	//https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
  //Changes cursor on hover
  //document.getElementById('graph').style.cursor = node && !node.hidden ? 'pointer' : null;	
  //
  //checks values of hovered nodes
  //if(node && prevNode) console.log("wah wah");
  //try{console.log(`${node.Name}, ${prevNode.Name}`); }
  //catch(err){try {console.log(`null, ${prevNode.Name}`); }
  //catch(err){console.log(`${node.Name}, null`); }}
	//Checks if hovered node is null
  highlightedNodes.clear();
  highlightedLinks.clear();
  if (node){
    //If in edit mode, index doesn't update and splices out wrong node
    if(!editMode) {bringNodeToTop(node);}

    highlightedNodes.add(node);
    node.childLinks.forEach(link => {
      highlightedLinks.add(link);
      highlightedNodes.add(nodesByName[link.Target]);
    })
    node.parentLinks.forEach(link => {
      highlightedLinks.add(link);
      highlightedNodes.add(nodesByName[link.Source]);
    })

    if(prevNode && prevNode != node){
      removeHoverWindow(prevNode)
    }
    
    node.fx = node.x; node.fy = node.y;

  }
  else{
    removeHoverWindow(prevNode);
    if(!prevNode.pinned){prevNode.fx = null; prevNode.fy = null;}
  }
}


function bringNodeToTop(node){

    //*Change index order to paint on top on hover - Update messes with physics/graph shape
    // graphData_Base.nodes.push(graphData_Base.nodes[node.index]);
    // graphData_Base.nodes.splice(node.index, 1);  
    //updateGraphData();

    console.log(Graph.graphData().nodes);
  Graph.graphData().nodes.splice(node.index, 1);  
  Graph.graphData().nodes.push(node);
    console.log(Graph.graphData().nodes[Graph.graphData().nodes.length-1]);
  for (let i = Graph.graphData().nodes.length-1; i >= 0; i--){
    Graph.graphData().nodes[i].index = i;
  }
    
}

function removeHoverWindow(node){

      if (document.getElementById("hoverWindow")){

   // console.log("hoverWindow value: " + document.getElementById("hoverWindow").value);
       // node = nodesByName[document.getElementById("hoverwindow").value];
    //console.log(node);
        document.getElementById("hoverWindow").remove();

      }
      if(!node.pinned){
        node.fx = null;
        node.fy = null;
      }
      node.nodeWindowOpen = false;
      node.hwWidth = null;
      node.hwHeight = null;
      node.hwX = null;
      node.hwY = null;
}

function nodeClickFn(node){
  if(node){createHoverWindow(node);}  
}

function removeNode(node){
  console.log(node);
  for(const [i, link] of node.childLinks.entries()){
    console.log(link);
    removeLink(link);
  }
  for(const [i, link] of node.parentLinks.entries()){
    console.log(link);
    removeLink(link);
  }
  graphData_Base.nodes.splice(graphData_Base.nodes.indexOf(node), 1);
  updateGraphData();
}

function backgroundClickFn(event){
  //removeHoverWindow();
  if (!editMode) return;
  const coords = Graph.screen2GraphCoords(event.layerX, event.layerY);
  graphData_Base.nodes.push({Name:"Node_" + graphData_Base.nodes.length,x: coords.x, y:coords.y, hidden:false, Size: 1});
  makeOneNodeImage(graphData_Base.nodes.length-1);
  updateGraphData();
}

function nodeDragFn(dragNode, translate){
  //if(translate.x + translate.y < 0.5) nodeClickFn(dragNode);
  //console.log(translate.x + " " + translate.y);
  if(!editMode) return;
  for(const [i,node] of graphData_Base.nodes.entries()) {
    //let node = graphData_Base.nodes[i];
    //console.log(node);
    if(dragNode === node){continue;}
    if(!interimLink && distanceCalc( node, dragNode) < 25){
      setInterimLink( node, dragNode);
      break;
    }
    if(interimLink){ 
      if(node !== nodesByName[interimLink.Target] && distanceCalc(node,dragNode) < 25){
        removeLink(interimLink);
        setInterimLink( node, dragNode);
      }
      if(distanceCalc(dragNode, nodesByName[interimLink.Source]) > 60){
        removeInterimLinkWithoutSetting();
      }
    }
  }
}

function distanceCalc(node1, node2){
  //Pythagoras let's goooo
  //console.log(node1.Name);
  //console.log(node2.Name); 
  return Math.sqrt(Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2));
}

function setInterimLink(source, target){
  //Check if link already exists --- Makes it unable to have reciprocal links ---
  //for(const [i,link] of source.childLinks.entries()) {
  //  if(link.Target == target.Name) return;
  //}
  //for(const [i,link] of target.childLinks.entries()) {
  //  if(link.Target == source.Name) return;
  //}
  interimLink = {Source: source.Name, Target: target.Name, Relation: "", Strength:""};
  graphData_Base.links.push(interimLink);
  updateGraphData();
}

function removeLink(link){
  //Does not remove if it does not find the link(indexOf() returns -1)
  if(link && graphData_Base.links.indexOf(link) != -1){
    graphData_Base.links.splice(graphData_Base.links.indexOf(link), 1);
  }
}

function removeInterimLinkWithoutSetting(){
  removeLink(interimLink);
  interimLink = null;
  updateGraphData();

}

function nodeDragEndFn(node){
  if(editMode){
    interimLink = null;
    updateGraphData();
  }
  if(!node.pinned){node.fx = null; node.fy = null;}
}

function createHoverWindow(node){
  if(node.nodeWindowOpen) return;
  //***Adjust pop-up based on viewport edges
  //***Change window size based on zoom (js to css class style)
  const hoverWindow = document.createElement("span");
  //Values to be used for screen coords, not graph coords
  const sidePadding = 15 * Graph.zoom() * node.Size;
  const topPadding = -15 * Graph.zoom();

  hoverWindow.id = "hoverWindow";
  hoverWindow.classList.add("hoverWindow");  //(Class for CSS style)
  hoverWindow.innerHTML = createHoverWindowHTML(node);
  hoverWindow.value = node.Name;

  //Populate window in document so window width/height is rendered
  document.getElementById("graph").prepend(hoverWindow);
  //Add listener for button after it's made
  document.getElementById("hideNodeHWBt").addEventListener("click", hideNodeFn);
  if(editMode){document.getElementById("EditNodeHWBt").addEventListener("click", makeEditNodeForm);}

  const nodeScreenCoords = Graph.graph2ScreenCoords(node.x, node.y);

  //Offset for if bottom of hover window is below bottom of the graph render box 
  const hwYEdgeOffset = nodeScreenCoords.y + topPadding + hoverWindow.getBoundingClientRect().height - Graph.height();
  if (hwYEdgeOffset > 0){node.hwYEdgeOffset = hwYEdgeOffset;}
  else {node.hwYEdgeOffset = 0;}
  const hwXEdgeOffset = nodeScreenCoords.x + sidePadding + hoverWindow.getBoundingClientRect().width - Graph.width();
  if (hwXEdgeOffset > 0){node.hwXEdgeOffset = hwXEdgeOffset;}
  else {node.hwXEdgeOffset = 0;}

  //Position of top left corner of hoverWindow HTML Element
  hoverWindow.style.left = `${(nodeScreenCoords.x + sidePadding - node.hwXEdgeOffset)}px`;
  hoverWindow.style.top = `${(nodeScreenCoords.y + topPadding - node.hwYEdgeOffset)}px`;


  const hwGraphTopLeftCoords = Graph.screen2GraphCoords(hoverWindow.getBoundingClientRect().left, hoverWindow.getBoundingClientRect().top);
  const hwGraphBotRightCoords = Graph.screen2GraphCoords(hoverWindow.getBoundingClientRect().right, hoverWindow.getBoundingClientRect().bottom);
  //Setting for hitbox *Translated, graph coords*
  //+ compensating for window edge margin
  node.hwX = hwGraphTopLeftCoords.x - 5;
  node.hwY = hwGraphTopLeftCoords.y - 5;
  node.hwWidth = hwGraphBotRightCoords.x - hwGraphTopLeftCoords.x;
  node.hwHeight = hwGraphBotRightCoords.y - hwGraphTopLeftCoords.y;

  node.nodeWindowOpen = true;

  console.log("nodeWindowOpen");

  if(node.Name == "Nagase Yuka"){console.log(`nodeWindowOpen: ${node.nodeWindowOpen},\nNode coords: ${node.x}, ${node.y}\nHTML-TLedCords: ${nodeScreenCoords.x}, ${nodeScreenCoords.y}
Graph Height: ${Graph.height()}`)};

  node.fx = node.x; node.fy = node.y;


}

function createHoverWindowHTML(node){
	let hwHTMLString = ""; 
	//https://www.freecodecamp.org/news/html-button-onclick-javascript-click-event-tutorial/
	//'<img class= "hwIcon" src="' + Flourish.static_prefix + '/pin.svg" width="20" height="20"><br>' +
  if(editMode){
    hwHTMLString += `<button type="button" value="${node.Name}" id="EditNodeHWBt" class="hWButton">Edit node</button>`;
  } 
	hwHTMLString += `<button type="button" value="${node.Name}" id="hideNodeHWBt" class="hWButton">Hide node</button>`;
  hwHTMLString += `<br>
  <img class= "hWImg" src="${node.Image}">
	<p style="text-align:center; padding: 0px; font-size: 125%; margin: 3px">${node.Name}</p>
  <p style="text-align: center; padding: 0px; margin: 3px">${node.Notes}</p>
	<a href="${node.Link}"><p style="text-align:center"> Link </p></a>`
	;
	return hwHTMLString;
}



function pinNode(node){
	console.log(node);
	if (!node.pinned){
		node.fx = node.x; 
		node.fy = node.y;
		node.pinned = true;
	}
	else {
		node.fx = null;
		node.fy = null;
		node.pinned = false;
	}
}

function nodeDistanceFunction(link,id){
  //console.log(link);
  const dfNodeDistance = dfNodeSize + 50; 

  if(link.Strength){
    //***Add minimum distance to prevent overlapping(add radiuses of source and target)
    //if(link.rStrength * dfNodeDistance < link.source.Size * dfNodeSize + link.target.Size * dfNodeSize){
    //  return link.source.Size * dfNodeSize + link.target.Size * dfNodeSize; 
    //}
    return link.Strength * dfNodeDistance;
  }
  else{
    return distanceCalc(link.source, link.target);
  }
    
}

function drawLinkCanvasObject(link, ctx){
    //console.log(link);
    if(link.hovering && link.Relation != ""){
        //calculate middle (from example)
        //const linkMiddle = Object.assign(...['x', 'y'].map(c => ({
        //    [c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
        //})));
        
        const linkMiddlex = (link.target.x - link.source.x)/2 + link.source.x;
        const linkMiddley = (link.target.y - link.source.y)/2 + link.source.y;


      ctx.textAlign = "center";
      ctx.font = `4px Tahoma`;
      ctx.fillStyle = "#dededeCC"
      ctx.fillRect(linkMiddlex - (ctx.measureText(link.Relation).width/2) - 2, 
				 linkMiddley - 2,
				 ctx.measureText(link.Relation).width + 4,
				 7);
      ctx.fillStyle = "Black";
      ctx.textBaseline = "top";
      ctx.fillText(link.Relation, linkMiddlex, linkMiddley);

    }
    else{}
}

function checkLinkHover(link, prevLink){
    if(link){
        if(prevLink && prevLink != link){
            prevLink.hovering = false;
        }
        link.hovering = true;
    }
    else{
        prevLink.hovering = false;
    }
}

function linkClickFn(link, event){
  if(!editMode) return;
  
  const linkEditWindow = document.createElement("div");
  selectedLink = link;

  const editLinkWindowHTMLString = `
<div><label>Relation Notes: </label><input id="LinkRelationField" value="${link.Relation}"></div>
<div><label>Strength: </label><input id="LinkStrengthField" value="${link.Strength}"></div>
<div><label>Style: </label><select id="LinkStyleField">
<option value="solid">Solid</option>
<option value="dash">Dashed</option>
<option value="arrow">Arrow</option>
</select></div>
<div><label>Color: </label><input type="color" id="LinkColorField" list="ColorDatalist" value="${link.Color}"></div>
<button type="button" id=EditLinkFormSubmitBt value="${link.index}" style="position:absolute;left:40%;bottom:0.75em;">Confirm</input>
<button type="button" id=EditLinkFormCancelBt style="position:absolute;right:1em;bottom:0.75em;margin-top:2em;">Cancel</input>
<button type="button" id=DeleteLinkBt style="position:absolute;left:1em;bottom:0.75em;margin-top:2em;">Delete</input>

`;

  linkEditWindow.id = "EditLinkForm";
  linkEditWindow.classList.add("formWindow");  //(Class for CSS style)
  linkEditWindow.innerHTML = editLinkWindowHTMLString;
  linkEditWindow.value = link.index;
  linkEditWindow.style.left = (event.clientX-50) + "px";
  linkEditWindow.style.top = (event.clientY-50) + "px";


  document.getElementById("graph").prepend(linkEditWindow);
  document.getElementById("LinkStyleField").value = link.Style;
  document.getElementById("EditLinkFormSubmitBt").addEventListener("click",editLinkFormSubmitFn);
  document.getElementById("EditLinkFormCancelBt").addEventListener("click",formCancelFn);
  document.getElementById("DeleteLinkBt").addEventListener("click",deleteLinkFromBtFn);
  document.getElementById("LinkColorField").addEventListener("change",addColortoDatalist);
}

function editLinkFormSubmitFn(){
  const link = selectedLink;
  if(document.getElementById("LinkRelationField").value){
  link.Relation = document.getElementById("LinkRelationField").value;
  }else{link.Relation="";}
  link.Strength = document.getElementById("LinkStrengthField").value;
  link.Style = document.getElementById("LinkStyleField").value;
  link.Color = document.getElementById("LinkColorField").value;
  this.parentNode.remove();
  selectedLink = null;
}

function deleteLinkFromBtFn(){
  removeLink(selectedLink);
  updateGraphData();
  selectedLink = null;
  this.parentNode.remove();
}

function deleteNodeFromBtFn(){
  console.log(this.value);
  removeNode(nodesByName[this.value]);
  this.parentNode.remove();
}

function nodeLabelsToggleFn(){
  
  if(showNodeLabel){
    showNodeLabel = false;
    document.getElementById("HideNodeLabelsBt").innerHTML = "Show Node Labels";
  }
  else{
    showNodeLabel = true;
    document.getElementById("HideNodeLabelsBt").innerHTML = "Hide Node Labels";
  }

}

function hideNodeFn(){
    console.log("wah");
    nodesByName[this.value].hidden = !nodesByName[this.value].hidden;
    updateGraphData();
}

function showHiddenNodesFn (){
  graphData_Base.nodes.forEach(node => {
    node.hidden = false;
  })
  updateGraphData();
}

function toggleEditModeFn(){
  editMode = !editMode;
  if(editMode){
    document.getElementById("EditBt").innerHTML = "Stop Editing";
    document.getElementById("NewGraphBt").style.display = "initial";
  }
  else{
    document.getElementById("EditBt").innerHTML = "Edit <br>Graph";
    document.getElementById("NewGraphBt").style.display = "none";
  }
}

function makeEditNodeForm(event){
  //console.log(nodesByName[this.value]);
  const node = nodesByName[this.value];
  const editFormHTMLString = `
<div><label>Name: </label><input pattern="[^<>]{30}"id="NodeNameField" value="${node.Name}"></div>
<div><label>Image: </label><input id="NodeImageField" value="${node.Image}"></div>
<div><label>Link: </label><input id="NodeLinkField" value="${node.Link}"></div>
<div><label>Notes: </label><input id="NodeNotesField" value="${node.Notes}"></div>
<div><label>Size: </label><input id="NodeSizeField" value="${node.Size}"></div>
<div><label>Shape: </label><select id="NodeShapeField">
<option value="circle">Circle</option>
<option value="square">Square</option>
<option value="diamond">Diamond</option>
</select></div>
<div><label>Border Color: </label><input type="color" id="NodeColorField" list="ColorDatalist" value="${node.BorderColor}"></div>
<button type="button" id="EditNodeFormSubmitBt" value="${node.Name}" style="position:absolute;left:40%;bottom:0.75em;">Confirm</input>
<button type="button" id="EditNodeFormCancelBt" style="position:absolute;right:1em;bottom:0.75em;">Cancel</input>
<button type="button" id=DeleteNodeBt style="position:absolute;left:1em;bottom:0.75em;margin-top:2em;"value="${node.Name}">Delete</input>
`;
  const formWindow = document.createElement("div");

  formWindow.id = "EditNodeForm";
  formWindow.classList.add("formWindow");  //(Class for CSS style)
  formWindow.innerHTML = editFormHTMLString;
  formWindow.value = node.Name;




  document.getElementById("graph").prepend(formWindow);

  let yEdgeOffset = Graph.height() - (event.clientY-50) - formWindow.getBoundingClientRect().height;
  if(yEdgeOffset > 0){yEdgeOffset = 0;}
  let xEdgeOffset = Graph.width() - (event.clientX-50) - formWindow.getBoundingClientRect().width;
  console.log(formWindow.getBoundingClientRect().width );
  if(xEdgeOffset > 0){xEdgeOffset = 0;}

  formWindow.style.left = (event.clientX-50 + xEdgeOffset) + "px";
  formWindow.style.top = (event.clientY-50 + yEdgeOffset) + "px";

  document.getElementById("NodeShapeField").value = node.Shape;
  document.getElementById("EditNodeFormSubmitBt").addEventListener("click",editNodeFormSubmitFn);
  document.getElementById("EditNodeFormCancelBt").addEventListener("click",formCancelFn);
  document.getElementById("DeleteNodeBt").addEventListener("click",deleteNodeFromBtFn);
  document.getElementById("NodeColorField").addEventListener("change",addColortoDatalist);
}

function addColortoDatalist(event){
    const option = document.createElement("option");
    option.value = event.target.value;
    document.getElementById("ColorDatalist").appendChild(option);
}

function editNodeFormSubmitFn(){
  const node = nodesByName[this.value];
  console.log(node);
  node.Name = document.getElementById("NodeNameField").value;
  node.Image = document.getElementById("NodeImageField").value;
  node.Link = document.getElementById("NodeLinkField").value;
  node.Notes = document.getElementById("NodeNotesField").value;
  node.Size = document.getElementById("NodeSizeField").value;
  node.Shape = document.getElementById("NodeShapeField").value;
  node.BorderColor = document.getElementById("NodeColorField").value;
  if(node.childLinks){
    for(const [i, link] of node.childLinks.entries()){
      //console.log(link.Source);
      link.Source = node.Name;
    }
  }
  if(node.parentLinks){
    for(const [i, link] of node.parentLinks.entries()){
      link.Target = node.Name;
    }
  }
  updateGraphData();
  document.getElementById("EditNodeForm").remove();
}

function formCancelFn(){
  this.parentNode.remove();
  if(nodesFileURL){URL.revokeObjectURL(nodesFileURL);}
  if(linksFileURL){URL.revokeObjectURL(linksFileURL);}
  if(completeGraphURL){URL.revokeObjectURL(completeGraphURL);}
}

document.getElementById("HideNodeLabelsBt").addEventListener("click", nodeLabelsToggleFn);
document.getElementById("HiddenNodesBt").addEventListener("click", showHiddenNodesFn);
document.getElementById("EditBt").addEventListener("click",toggleEditModeFn);
document.getElementById("SaveBt").addEventListener("click",createDLFiles);
document.getElementById("LoadBt").addEventListener("click",createUploadWindow);
document.getElementById("NewGraphBt").addEventListener("click",goToNewGraph);

function goToNewGraph(){
  if(!confirm("All current data will be cleared. \nAre you sure?")) return;
  const fileEle = document.createElement('a');
  fileEle.setAttribute("href", "/");
  fileEle.setAttribute("style", "display: none");
  document.body.appendChild(fileEle);
  fileEle.click();
  document.body.removeChild(fileEle);
}

let nodesFileURL = null;
let linksFileURL = null;
let completeGraphURL = null;

function createDLFiles (){
  const nodesDataStripped = graphData_Base.nodes.map(node => {
    return {"Name": node.Name, "Image": node.Image, "Link": node.Link, "Notes": node.Notes, "Size": node.Size, "Shape": node.Shape};
  }); 
  const linksDataStripped = graphData_Base.links.map(link => {
    return {"Source": link.Source, "Target": link.Target, "Relation":link.Relation, "Strength":link.Strength,"Style":link.Style,"Color":link.Color};
  }); 

  const nodesMoreData = graphData_Base.nodes.map(node => {
    return {"Name": node.Name, "Image": node.Image, "Link": node.Link, "Notes": node.Notes, "Size": node.Size, "Shape": node.Shape, "x": node.x, "y": node.y, "pinned":node.pinned, "hidden":node.hidden};
  }); 


  const nodesFileBlob = new Blob([Papa.unparse(nodesDataStripped)], {type: "text/csv"});
  nodesFileURL = URL.createObjectURL(nodesFileBlob);
  const linksFileBlob = new Blob([Papa.unparse(linksDataStripped)], {type: "text/csv"});
  linksFileURL = URL.createObjectURL(linksFileBlob);

  //for(const [i,node] of graphData_Base.nodes.entries()) {
  //  node.childLinks = null; node.parentLinks = null;
  //}
  console.log(JSON.stringify({"nodes": nodesMoreData, "links": linksDataStripped}));
  console.log(Graph.graphData());
  const completeGraphBlob = new Blob([JSON.stringify({"nodes": nodesMoreData, "links": linksDataStripped})],{type: "application/json"});
  completeGraphURL = URL.createObjectURL(completeGraphBlob); 

  const dlWindow = document.createElement("div");

  const dlWindowHTMLString = `
<button style="display: block;width:40%; margin:auto; margin-bottom:1em; padding:0.5em" onclick="location.href='${nodesFileURL}';">Download nodes .csv</button>
<button style="display: block;width:40%; margin:auto; margin-bottom:1em; padding:0.5em" onclick="location.href='${linksFileURL}';">Download links .csv</button>
<button style="display: block;width:40%; margin:auto; margin-bottom:1em; padding:0.5em" onclick="window.open('${completeGraphURL}');">Get current graph state .json</button>
<button type="button" id="CancelBt" style="display: block;width:40%; margin:auto;">Close</input>
`;

  dlWindow.id = "dlWindow";
  dlWindow.classList.add("formWindow");  //(Class for CSS style)
  dlWindow.innerHTML = dlWindowHTMLString;

  document.getElementById("graph").prepend(dlWindow);
  document.getElementById("CancelBt").addEventListener("click",formCancelFn);

  //Automatically open download confirmation
  //const fileEle = document.createElement('a');
  //fileEle.innerHTML = nodeFileURL;
  //fileEle.setAttribute("href", nodeFileURL);
  //fileEle.setAttribute("download", "customotagraph.csv");
  //fileEle.setAttribute("style", "display: none");
  //document.body.appendChild(fileEle);
  //fileEle.click();
  //document.body.removeChild(fileEle);
  //URL.revokeObjectURL(nodeFileURL);
}

function createUploadWindow(){
  const uploadWindowHTMLString = `
<div>
<label style="display:inline-block; width:30%" for="NodesUploadInupt">Nodes .csv: </label><input type="file" id="NodesUploadInput" accept=".csv">
</div>
<div>
<label style="display:inline-block; width:30%" for="LinksUploadInupt">Links .csv: </label><input type="file" id="LinksUploadInput" accept=".csv">
</div>
<button type="button" id="pasteJSONBt" style="display:block; position:relative; margin-bottom:1em; left:35%">Paste JSON</input>
<button type="button" id="ToURLsBt" style="position:relative; margin-bottom:1em; left:30%">Link Google Sheets File</input>
<button type="button" id="SubmitBt" style="position:absolute;left:40%;bottom:0.75em;">Submit</input>
<button type="button" id="CancelBt" style="position:absolute;right:1em;bottom:0.75em;">Cancel</input>
`;

  const uploadWindow = document.createElement("form");

  uploadWindow.id = "uploadWindow";
  uploadWindow.classList.add("formWindow");
  uploadWindow.innerHTML = uploadWindowHTMLString;
  uploadWindow.style.width = "20em"; 
  uploadWindow.action = "javascript:void(0);"; 

  document.getElementById("graph").prepend(uploadWindow);

  document.getElementById("CancelBt").addEventListener("click",formCancelFn);
  document.getElementById("SubmitBt").addEventListener("click",uploadWindowSubmitFn);
  document.getElementById("ToURLsBt").addEventListener("click",linkURLWindowFn);
  document.getElementById("pasteJSONBt").addEventListener("click",pasteJSONWindowFn);
}

function pasteJSONWindowFn (){
const pasteJSONWindowHTMLString = `
<textarea id="JSONpasteField" rows="10" cols="40"></textarea>
<button type="button" id="SubmitJSONBt" style="position:absolute;left:40%;bottom:0.75em;">Submit</input>
<button type="button" id="CancelJSONBt" style="position:absolute;right:1em;bottom:0.75em;">Cancel</input>
`

  const pasteJSONWindow = document.createElement("div");

  pasteJSONWindow.id = "pasteJSONWindow";
  pasteJSONWindow.classList.add("formWindow");
  pasteJSONWindow.innerHTML = pasteJSONWindowHTMLString;
  pasteJSONWindow.style.width = "20em"; 
  pasteJSONWindow.style.zIndex = '4';
  document.getElementById("graph").prepend(pasteJSONWindow);

  document.getElementById("SubmitJSONBt").addEventListener("click",applyJSONtoGraph);
  document.getElementById("CancelJSONBt").addEventListener("click",formCancelFn);

}

function applyJSONtoGraph(){
  const newJSON = document.getElementById("JSONpasteField").value; 
  graphData_Base = JSON.parse(newJSON);
  updateGraphData();
}

function linkURLWindowFn(){
const linkURLHTMLString = `
<div>URLs must be links from Google Sheets (File>Share>Publish to web>.csv)</div>
<div>Sheets must follow <a href="https://docs.google.com/spreadsheets/d/1LMlbwhMG8tbbwS_zPE57ibPE8ucAqE_QAkvovEOA-YM/edit?usp=sharing">template sheet</a></div>
<div>Once linked, the page's url will load your spreadsheet, and can be easily shared</div>
<div><label>Node .csv link: </label><input id="NodeURLField"style="margin:1em;"></div>
<div><label>Link .csv link: </label><input id="LinkURLField"style="margin:1em;"></div>
<button type="button" id="SubmitBt" style="position:absolute;left:40%;bottom:0.75em;">Submit</input>
<button type="button" id="CancelBt" style="position:absolute;right:1em;bottom:0.75em;">Cancel</input>
`
  const linkURLWindow = document.createElement("div");

  linkURLWindow.id = "linkURLWindow";
  linkURLWindow.innerHTML = linkURLHTMLString;
  linkURLWindow.classList.add("formWindow");
  linkURLWindow.style.zIndex = '4';
  linkURLWindow.style.width = "20em";

  document.getElementById("graph").prepend(linkURLWindow);

  document.getElementById("CancelBt").addEventListener("click",formCancelFn);
  document.getElementById("SubmitBt").addEventListener("click",createURLfromLinks);
}

function createURLfromLinks(event){
  const nodesurl = document.getElementById("NodeURLField").value;
  const linksurl = document.getElementById("LinkURLField").value;

  const sheetID = nodesurl.split('/')[6];
  const nodesGID = nodesurl.split('=')[1].split('&')[0];
  const linksGID = linksurl.split('=')[1].split('&')[0];

  const fileEle = document.createElement('a');
  fileEle.setAttribute("href", `/${sheetID}/${nodesGID}/${linksGID}`);
  fileEle.setAttribute("style", "display: none");
  document.body.appendChild(fileEle);
  fileEle.click();
  document.body.removeChild(fileEle);
  }

function uploadWindowSubmitFn(){
  console.log(document.getElementById("NodesUploadInput").files[0]);
  Papa.parse(document.getElementById("NodesUploadInput").files[0],
    {header: true,
      complete: function(results, file) {graphData_Base.nodes = results.data; makeNodeImages(); if(graphData_Base.links.length != 0){updateGraphData();} }
    });


  Papa.parse(document.getElementById("LinksUploadInput").files[0],
    {header: true,
      complete: function(results, file) {graphData_Base.links = results.data; if(graphData_Base.nodes.length != 0){updateGraphData();} }
    });

  this.parentNode.remove();
}
