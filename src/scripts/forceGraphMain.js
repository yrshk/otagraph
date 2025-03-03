import ForceGraph from 'force-graph';
//import csv from 'csv-parser';
import fs from 'fs';

import {getStore} from '@netlify/blobs';

import {defaultNodesData, defaultLinksData} from '../scripts/defaultGraphData2';

import Papa from 'papaparse';



const nodesDefaultFileURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlCIn7nwlbCTS3bXrJeeYCe6dH4wGOg2tyaueM9AoCW38TM3Tq_OfdjAxbZhWJPwEA_CWPcirNE6ZN/pub?gid=1663122819&single=true&output=csv";
const linksDefaultFileURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlCIn7nwlbCTS3bXrJeeYCe6dH4wGOg2tyaueM9AoCW38TM3Tq_OfdjAxbZhWJPwEA_CWPcirNE6ZN/pub?gid=0&single=true&output=csv" 


const Graph = new ForceGraph(document.getElementById('graph'));


//Copy pasted const function
const updateGraphData = () => {
  Graph.graphData(getVisibleData());
  console.log("graph updated"); 
  console.log(graphData_Base.nodes);
  };

//Default node size, to be scaled with individual node multiplier
const dfNodeSize = 30;

var showNodeLabel = true;


//const nodesFileData = "../scripts/csvparser.js"; 

// const graphData_Base.nodes = Papa.parse(defaultNodesData,{header: true}).data;

let graphData_Base = {nodes:[],links:[]};
let nodesByName = [];
let hiddenNodesData = [];

function makeNodeImages() {
//Populating node objects with Image object, setting source
  for (let i = 0; i < graphData_Base.nodes.length; i++) {
    
    const img = new Image();
    img.onLoad = new function (){
      graphData_Base.nodes[i].nodeImage = img;

      // console.log(`${data.graphData_Base.nodes[i].Name} is loaded`);
      }
    img.src = graphData_Base.nodes[i].Image;
//console.log(graphData_Base.nodes[i].Image) 

    // img.style.borderRadius = "100%";
    
    // return;
  };


}


Papa.parse(nodesDefaultFileURL,
  {header: true,
  download: true, 
  complete: function(results, file) {graphData_Base.nodes = results.data; makeNodeImages(); if(graphData_Base.links.length != 0){setNodeByNameArray();updateGraphData();} }
});


Papa.parse(linksDefaultFileURL,
  {header: true,
  download: true, 
  complete: function(results, file) {graphData_Base.links = results.data; if(graphData_Base.nodes.length != 0){setNodeByNameArray();updateGraphData();} }
});


function setNodeByNameArray (){
  //Makes array of pairs from nodes data and converts it to one object with names as keys
  nodesByName = Object.fromEntries(graphData_Base.nodes.map(node => [node.Name, node]));
  //defines childLinks array in every node to use Array.push() for linkes
  for (const [name, node] of Object.entries(nodesByName)){node.childLinks = [];node.hidden=false;}
  //Assigns every link to it's source node
  graphData_Base.links.forEach(link => {
    nodesByName[link.Source].childLinks.push(link);
  })
}

function getVisibleData (){
  const visibleNodes = [];
  const visibleLinks = [];

  graphData_Base.nodes.forEach((node) => {
    if(!node.hidden) {
      visibleNodes.push(node);
      node.childLinks.forEach((link) => {
        if(!nodesByName[link.Target].hidden){visibleLinks.push(link)};
      })
    }
  })
  console.log(visibleLinks);
  return {nodes: visibleNodes, links: visibleLinks};
}
 



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
.nodeCanvasObject(({ nodeImage, x, y, Name   ,  hwX,hwY,hwWidth,hwHeight, hovering,  Size, Shape}, ctx) => paintNodeCircle({ nodeImage, x, y, Name, hwX,hwY,hwWidth,hwHeight, hovering,  Size, Shape}, ctx, dfNodeSize))


.nodePointerAreaPaint((node, color, ctx) => {
  // if(node.Name == "Nagase Yuka"){console.log(node);}
  
  const nodeSize = node.Size * dfNodeSize;

  if (!node.hovering){
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
.onNodeHover((node, prevNode) => makeHoverWindow(node, prevNode))
.onNodeDragEnd((node) => {if(!node.pinned){node.fx = null; node.fy = null;}})

  
.linkWidth(2)
// .lineDirectionalArrowLength(link => link.relation == "Illustrator"? 6 : 0)
.linkDirectionalArrowLength((cLink) => {
  if(cLink.Style == "arrow"){
    return 7;
  }
  
})
.linkDirectionalArrowRelPos(0.7)
.linkLineDash((cLink) => {
    if(cLink.Style == "dash")
        return [3, 2];
    })
.linkAutoColorBy('relation')
.linkColor((cLink) => {
    return cLink.Color;
})
.onNodeRightClick((node) => pinNode(node))
.linkCanvasObjectMode(() => 'after')
.linkCanvasObject((link, ctx) => drawLinkCanvasObject(link, ctx))
.onLinkHover((link, prevLink) => checkLinkHover(link, prevLink))
.linkHoverPrecision(8)
;

Graph.d3Force('link').distance(link => nodeDistanceFunction(link));


updateGraphData();

console.log(Graph.graphData().nodes);
	
//***************************************************************************************************************************************
//										Main graph settings
//***************************************************************************************************************************************
	



function paintNodeCircle({ nodeImage, x, y, Name,  imdefined,hwX,hwY,hwWidth,hwHeight, hovering, index,  Size, Shape}, ctx, dfNodeSize){
	//Circle image from https://stackoverflow.com/questions/4276048/html5-canvas-fill-circle-with-image
	//Fit + preserve ascpect ratio from https://stackoverflow.com/questions/23104582/scaling-an-image-to-fit-on-canvas
	// drawImage reference https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
	//context.arc(x, y, r, sAngle, eAngle, counterclockwisebool)
	//context.drawImage(img, x, y, width, height)/context.drawImage(img, sx, sy, swidth, sheight, x, y, width, height)
	
	
	
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



if(showNodeLabel){
    ctx.textAlign = "center";
    ctx.font = `${ftSize}px Tahoma`;
    ctx.fillStyle = "#dededeCC"
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
  // if(Name == "Nagase Yuka"){console.log("fill hover check: " + hovering + "\n hwX: " + hwX + "\n hwY: " + hwY + "\n node x: " + x + "\n node y: " + y + "\n hwWidth: " + hwWidth + "\n hwHeight: " + hwHeight);}
	if(hovering){
		ctx.fillStyle = "Red";
		ctx.fillRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize); 
		ctx.fillRect(hwX, hwY, hwWidth, hwHeight);
		//fill in gap between node and hover window
		ctx.fillRect(x, y-nodeSize/2,  hwX - x, nodeSize*2);
	}

  if(!Shape){
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
  

	//***Add custom shift in nodes data /**Add fit/fill/stretch options
	//Circle image
  //console.log("Drawing " + Name);
  try{
	ctx.drawImage(nodeImage, 0, 0, nodeImage.width, nodeImage.height, 
					(x - nodeSize/2) + centerShift_x, (y - nodeSize/2) + centerShift_y, widthScaled, heightScaled);
  }
  catch (err){//console.log(`For ${Name}:` + err);
          }

	// ctx.beginPath();
	// ctx.arc(x, y, nodeSize / 2, 0, Math.PI * 2, true);
	// ctx.clip();
	// ctx.closePath();
	// ctx.restore();
	
	// ctx.drawImage(nodeImage, x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize);
	

	ctx.strokeStyle = 'DarkGray';
	ctx.lineWidth = 2;
  if(!Shape){
	//Circle outline
	ctx.stroke();
  }	

  else if(Shape == "square"){
    
    ctx.strokeRect(x-nodeSize/2, y-nodeSize/2, nodeSize,nodeSize);

  }
	
	return;
}


function makeHoverWindow(node, prevNode){
	//https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
  
  //Changes cursor on hover
  //document.getElementById('graph').style.cursor = node && !node.hidden ? 'pointer' : null;	
  
 
	//Checks if hovered node is null
	if (node){
			//*Change index order to paint on top on hover - Update messes with physics/graph shape
			// currentNodesData.push(currentNodesData[node.index]);
			// currentNodesData.splice(node.index, 1);  
			// updateGraphData();
			
            if(prevNode){
			if(prevNode != node){
				if(!prevNode.pinned){
					prevNode.fx = null;
					prevNode.fy = null;
				}
				prevNode.hovering = false;
				prevNode.hwWidth = null;
				prevNode.hwHeight = null;
				prevNode.hwX = null;
				prevNode.hwY = null;
			}
		}

			//Removes previous hovered node if hovered to overlapping node (didn't call with null node)
			if (document.getElementById("hoverWindow")){
			document.getElementById("hoverWindow").remove(); 
			}
			
			//***Adjust pop-up based on viewport edges
			//***Change window size based on zoom (js to css class style)
			const hoverWindow = document.createElement("span");
      //Values to be used for screen coords, not graph coords
			const sidePadding = 15 * Graph.zoom() * node.Size;
			const topPadding = -15 * Graph.zoom();
			
			hoverWindow.id = "hoverWindow";
			hoverWindow.classList.add("hoverWindow");  //(Class for CSS style)
			hoverWindow.innerHTML = createHoverWindowHTML(node);
			
			//Populate window in document so window width/height is rendered
			document.getElementById("graph").prepend(hoverWindow);
      //Add listener for button after it's made
      document.getElementById("hideNodeHWBt").addEventListener("click", hideNodeFn);
			
			const nodeScreenCoords = Graph.graph2ScreenCoords(node.x, node.y);
      
    //Offset for if bottom of hover window is below bottom of the graph render box 
			const hwYEdgeOffset = nodeScreenCoords.y + topPadding + hoverWindow.getBoundingClientRect().height - Graph.height();
			
			if (hwYEdgeOffset > 0){node.hwYEdgeOffset = hwYEdgeOffset;}
			else {node.hwYEdgeOffset = 0;}
		
      //Position of top left corner of hoverWindow HTML Element
			hoverWindow.style.left = `${(nodeScreenCoords.x + sidePadding)}px`;
			hoverWindow.style.top = `${(nodeScreenCoords.y + topPadding - node.hwYEdgeOffset)}px`;
			
			
			const hwGraphTopLeftCoords = Graph.screen2GraphCoords(hoverWindow.getBoundingClientRect().left, hoverWindow.getBoundingClientRect().top);
			const hwGraphBotRightCoords = Graph.screen2GraphCoords(hoverWindow.getBoundingClientRect().right, hoverWindow.getBoundingClientRect().bottom);
			//Setting for hitbox *Translated, graph coords*
     //+ compensating for window edge margin
			node.hwX = hwGraphTopLeftCoords.x - 5;
			node.hwY = hwGraphTopLeftCoords.y - 5;
			node.hwWidth = hwGraphBotRightCoords.x - hwGraphTopLeftCoords.x;
			node.hwHeight = hwGraphBotRightCoords.y - hwGraphTopLeftCoords.y;
			
			node.hovering = true;
			
	console.log("hovering");

  if(node.Name == "Nagase Yuka"){console.log(`Hovering: ${node.hovering},\nNode coords: ${node.x}, ${node.y}\nHTML-TLedCords: ${nodeScreenCoords.x}, ${nodeScreenCoords.y}
Graph Height: ${Graph.height()}`)};
			
			node.fx = node.x; node.fy = node.y;
			
		}
		
	else{
		if (document.getElementById("hoverWindow")){
			document.getElementById("hoverWindow").remove(); 
			}
		
		if(prevNode){
			if(prevNode != node){
				if(!prevNode.pinned){
					prevNode.fx = null;
					prevNode.fy = null;
				}
				prevNode.hovering = false;
				prevNode.hwWidth = null;
				prevNode.hwHeight = null;
				prevNode.hwX = null;
				prevNode.hwY = null;
			}
		}
		
	}
}



function createHoverWindowHTML(node){
	const hwHTMLString = 
	//https://www.freecodecamp.org/news/html-button-onclick-javascript-click-event-tutorial/
	//'<img class= "hwIcon" src="' + Flourish.static_prefix + '/pin.svg" width="20" height="20"><br>' +
	`<button type="button" value="${node.Name}" id="hideNodeHWBt" class="hWButton">Hide node</button>
  <br>
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
  const dfNodeDistance = dfNodeSize; 

  if(link.rStrength){
    //***Add minimum distance to prevent overlapping(add radiuses of source and target)
    //if(link.rStrength * dfNodeDistance < link.source.Size * dfNodeSize + link.target.Size * dfNodeSize){
    //  return link.source.Size * dfNodeSize + link.target.Size * dfNodeSize; 
    //}
    return link.rStrength * dfNodeDistance;
  }
  else{
    return dfNodeDistance;
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

document.getElementById("HideNodeLabelsBt").addEventListener("click", nodeLabelsToggleFn);
//document.getElementById("HiddenNodesData".addEventListener("click", showHiddenNodesFn);

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
  Graph.graphData().nodes.push(hiddenNodesData);
  hiddenNodesData = [];
}
