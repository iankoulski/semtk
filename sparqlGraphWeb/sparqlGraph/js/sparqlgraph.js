/**
 ** Copyright 2016 General Electric Company
 **
 ** Authors:  Paul Cuddihy, Justin McHugh
 **
 ** Licensed under the Apache License, Version 2.0 (the "License");
 ** you may not use this file except in compliance with the License.
 ** You may obtain a copy of the License at
 ** 
 **     http://www.apache.org/licenses/LICENSE-2.0
 ** 
 ** Unless required by applicable law or agreed to in writing, software
 ** distributed under the License is distributed on an "AS IS" BASIS,
 ** WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 ** See the License for the specific language governing permissions and
 ** limitations under the License.
 */


   
    var gOTree = null;
    var gOInfo = null;
    var gConn = null;
    var gQueryClient = null;
    var gTimeseriesResults = null;
    var gQueryResults = null;
    
    // PEC TODO: suspicious: are these used?  why?
    var gServerURL = null;
    var gKSURL = null;
    var gSource = null;
    
    var globalModalDialogue = null;
    
    // drag stuff
    var gDragLabel = "hi";
    var gLoadDialog;
    var gStoreDialog = null;
    
    var gNodeGroup = null;
    var gOInfoLoadTime = "";

    var gCurrentTab = g.tab.query ;
    
    var gMappingTab = null;
    var gUploadTab = null;
    var gReady = false;
        
    // READY FUNCTION 
    $('document').ready(function(){
    
    	document.getElementById("upload-tab-but").disabled = true;
    	document.getElementById("mapping-tab-but").disabled = true;
    	
    	// checkBrowser();
    	
    	initDynatree(); 
    	initCanvas();
    	
	    require([ 'sparqlgraph/js/mappingtab',
	              'sparqlgraph/js/uploadtab',
                  'sparqlgraph/js/modalstoredialog',
	              'local/sparqlgraphlocal'], function (MappingTab, UploadTab, ModalStoreDialog) {
	    
	    	console.log(".ready()");
	    	
	    	// create the modal dialogue 
	    	gLoadDialog = new ModalLoadDialog(document, "gLoadDialog");
	    	globalModalDialogue = new ModalDialog(document, "globalModalDialogue");
	    	
	    	 // set up the node group
	        gNodeGroup = new SemanticNodeGroup(1000, 700, 'canvas');
	        gNodeGroup.setAsyncPropEditor(launchPropertyItemDialog);
	        gNodeGroup.setAsyncSNodeEditor(launchSNodeItemDialog);
	        gNodeGroup.setAsyncLinkBuilder(launchLinkBuilder);
	        gNodeGroup.setAsyncLinkEditor(launchLinkEditor);
	        
	    	// load gUploadTab
	    	gUploadTab =  new UploadTab(document.getElementById("uploadtabdiv"), 
	    								document.getElementById("uploadtoolsdiv"), 
	    								doLoadConnection,
	    			                    g.service.ingestion.url,
	    			                    g.service.sparqlQuery.url);
	    	
	    	document.getElementById("upload-tab-but").disabled = false;
	    	
	    	// load gMappingTab
			gMappingTab =  new MappingTab(importoptionsdiv, importcanvasdiv, importcolsdiv, gUploadTab.setDataFile.bind(gUploadTab), logAndAlert );
	    	
	    	document.getElementById("mapping-tab-but").disabled = false;
	    
	        // load last connection
			var conn = gLoadDialog.getLastConnectionInvisibly();
			if (conn) {
				doLoadConnection(conn, false);
			}
			
			// make sure Query Source and Type disables are reset
			onchangeQuerySource();  
			onchangeQueryType(); 
			
	    	// SINCE CODE PRE-DATES PROPER USE OF REQUIRE.JS THROUGHOUT...
	    	// gReady is at the end of the ready function
	    	//        and tells us everything is loaded.
	   	    gReady = true;
	   	    console.log("Ready");
	   	    logEvent("SG Page Load");
                    
            gModalStoreDialog = new ModalStoreDialog(localStorage.getItem("SPARQLgraph_user"));
	   	    
		});
    });
    
    var checkBrowser = function() {
     	// Detect Browser
    	var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        if (! isFirefox) {
        	logAndAlert("This application uses right-clicks, which may be blocked by this browser.<br>Firefox is recommended.")
        }
    };
    
    var initCanvas = function() {
    	$("#canvas").droppable({
    	    hoverClass: "drophover",
    	    addClasses: true,
    	    over: function(event, ui) {
    	      logMsg("droppable.over, %o, %o", event, ui);
    	    },
    	    drop: function(event, ui) {
    	    	// drop nodes onto graph
    	    	
    	    	var gSource = ui.helper.data("dtSourceNode") || ui.draggable;
    			
    		  	// add the node to the canvas
    			var tsk = gOInfo.containsClass(gDragLabel);
    			
    			if ( gOInfo.containsClass(gDragLabel) ){
    				// the class was found. let's use it.
    				var nodelist = gNodeGroup.getArrayOfURINames();
    				var paths = gOInfo.findAllPaths(gDragLabel, nodelist, gConn.getDomain());
    				logEvent("SG Drop Class", "label", gDragLabel);
    				
    				// Handle no paths or shift key during drag: drop node with no connections
    				if (event.shiftKey || paths.length == 0) {
    					gNodeGroup.addNode(gDragLabel, gOInfo);
    			  		gNodeGroup.drawNodes();
    			  		guiGraphNonEmpty();
    			
    				} else {
    					// find possible anchor node(s) for each path
    					// start with disconnected option
    			  		var pathStrList = ["** Disconnected " + gDragLabel];
    			  		var valList = [[new OntologyPath(gDragLabel), null, false]];
    			  		
    			  		// for each path
    			  		for (var p=0; p < paths.length; p++) {
    			  			// for each instance of the anchor class
    			  			var nlist = gNodeGroup.getNodesByURI(paths[p].getAnchorClassName());
    			  			for (var n=0; n < nlist.length; n++) {
    			  				
    			  				pathStrList.push(genPathString(paths[p], nlist[n], false));
    			  				valList.push( [paths[p], nlist[n], false ] );
    			  				
    			  				// push it again backwards if it is a special singleLoop
    			  				if ( paths[p].isSingleLoop()) {
    			  					pathStrList.push(genPathString(paths[p], nlist[n], true));
    				  				valList.push( [paths[p], nlist[n], true ] );
    			  				}
    			  			}
    			  		}
    			  		
    			  		if (valList.length > 1) {
    			  			globalModalDialogue.listDialog("Choose the path", "Submit", pathStrList, valList, 1, dropCallback, "90%");
    			  		} else {
    			  			dropCallback(valList[0]);
    			  		}
    				}
    			}
    			else{
    				// not found
    				logAndAlert("Only classes can be dropped on the graph.");
    				
    			}
    	    }
      	});

    };
    
    /**
     * Add a node via path from anchorSNode
     * If there is no anchorSNode then just add path.startClass
     * @param val[] -  [path, anchorSNode, revFlag]
     */
    var dropCallback = function(val) {
    	var path = val[0];
    	var anchorNode = val[1];
    	var singleLoopFlag = val[2];
    	
    	if (anchorNode == null) {
    		gNodeGroup.addNode(path.getStartClassName(), gOInfo);
    	} else {
    		gNodeGroup.addPath(path, anchorNode, gOInfo, singleLoopFlag);
    	}
    	gNodeGroup.drawNodes();
      	guiGraphNonEmpty();
    };
    
    var initDynatree = function() {
    	
        // Attach the dynatree widget to an existing <div id="tree"> element
        // and pass the tree options as an argument to the dynatree() function:
        $("#treeDiv").dynatree({
            onActivate: function(node) {
                // A DynaTreeNode object is passed to the activation handler
                // Note: we also get this event, if persistence is on, and the page is reloaded.
                console.log("You activated " + node.data.title);
            },
            onDblClick: function(node) {
                // A DynaTreeNode object is passed to the activation handler
                // Note: we also get this event, if persistence is on, and the page is reloaded.
                console.log("You double-clicked " + node.data.title);
            },
    		
            dnd: {
            	onDragStart: function(node) {
                /** This function MUST be defined to enable dragging for the tree.
                 *  Return false to cancel dragging of node.
                 */
                	logMsg("tree.onDragStart(%o)", node);
                	console.log("dragging " + gOTree.nodeGetURI(node));
                	gDragLabel = gOTree.nodeGetURI(node);
                	return true;
            	},
            	onDragStop: function(node) {
        			logMsg("tree.onDragStop(%o)", node);
        			console.log("dragging " + gOTree.nodeGetURI(node) + " stopped.");
      			}
            	
        	},	
        	
            
            persist: true,
        });
        gOTree = new OntologyTree($("#treeDiv").dynatree("getTree"));
  	}; 
  	
    // PEC LOGGING
    // temporary logging require.js workaround
  	var logEvent = function (action, optDetailKey1, optDetailVal1, optDetailKey2, optDetailVal2) { 
    		kdlLogEvent(action, optDetailKey1, optDetailVal1, optDetailKey2, optDetailVal2);
    };
    
    var logAndAlert = function (msgHtml, optTitle) {
    	var title = typeof optTitle === "undefined" ? "Alert" : optTitle
    	kdlLogEvent("SG: alert", "message", msgHtml);
    	   
    	require(['sparqlgraph/js/modaliidx'], 
    	         function (ModalIidx) {
					ModalIidx.alert(title, msgHtml);
				});
    };
    
    var logAndThrow = function (msg) {
    		kdlLogAndThrow(msg);
    };
    
    var logNewWindow = function (msg) {
    		kdlLogNewWindow(msg);
    };
    
    // application-specific sub-class choosing
    subclassChooserDialog = function (oInfo, classUri, callback) {
    	var subClassUris = [classUri];
    	subClassUris.concat(oInfo.getSubclassNames(classUri));
    	
    	if (subClassUris.length == 1) { 
    		return callback(classUri); 
    		
    	} else {
    		
    	}
    	
    	
    };
    
    // application-specific property editing
    var launchPropertyItemDialog = function (propItem, draculaLabel) {
    	require([ 'sparqlgraph/js/modalitemdialog',
	            ], function (ModalItemDialog) {
    		
    		var dialog= new ModalItemDialog(propItem, gNodeGroup, getQueryClientOrInterface(), propertyItemDialogCallback,
    				                        {"draculaLabel" : draculaLabel}
    		                                );
    		dialog.show();
		});
    };
    
    var launchLinkBuilder = function(snode, nItem) {
		// callback when user clicks on a nodeItem	
    	var rangeStr = nItem.getUriValueType();
    	
    	// find nodes that might connect
    	var targetSNodes = gNodeGroup.getNodesBySuperclassURI(rangeStr, gOInfo);
    	// disqualify nodes already linked
    	var unlinkedTargetSNodes = [null];
    	var unlinkedTargetNames = ["New " + rangeStr + ""];

    	for (var i=0; i < targetSNodes.length; i++) {
    		if (nItem.getSNodes().indexOf(targetSNodes[i]) == -1) {
    			unlinkedTargetNames.push(targetSNodes[i].getSparqlID());
    			unlinkedTargetSNodes.push(targetSNodes[i]);
    		}
    	}
    	
    	// if there are no possible connections, just add a new node and connect.
    	if (unlinkedTargetSNodes.length == 1) {
    		buildLink(snode, nItem, null);			
    	} else {
  			globalModalDialogue.listDialog("Choose node to connect", "Submit", unlinkedTargetNames, unlinkedTargetSNodes, 0, buildLink.bind(this, snode, nItem), "75%");
    	}
	};
	
	var launchLinkEditor = function(snode, nItem, targetSNode, edge) {
		
		require([ 'sparqlgraph/js/modallinkdialog',
		            ], function (ModalLinkDialog) {
	    		
	    		var dialog= new ModalLinkDialog(nItem, snode, targetSNode, gNodeGroup, linkEditorCallback, {"edge" : edge});
	    		dialog.show();
			});
	};
	
	var linkEditorCallback = function(snode, nItem, targetSNode, data, optionalVal, deleteMarkerVal, deleteFlag) {
		
		// optionalFlag
		nItem.setSNodeOptional(targetSNode, optionalVal);
		nItem.setSnodeDeletionMarker(targetSNode, deleteMarkerVal);
		// deleteFlag
		if (deleteFlag) {
			snode.removeLink(nItem, targetSNode);
		} 
		
		gNodeGroup.drawNodes();
	};
	
	/**
	 * Link from snode through it's nItem to rangeSNode
	 * @param snode - starting point
	 * @param nItem - nodeItem
	 * @param rangeSnode - range node, if null then create it
	 */
	var buildLink = function(snode, nItem, rangeSnode) {
		var snodeClass = gOInfo.getClass(snode.fullURIName);
		var domainStr = gOInfo.getInheritedPropertyByKeyname(snodeClass, nItem.getKeyName()).getNameStr();
		
		if (rangeSnode == null) {
			var rangeStr = nItem.getUriValueType();
			var newNode = gNodeGroup.returnBelmontSemanticNode(rangeStr, gOInfo);
			gNodeGroup.addOneNode(newNode, snode, null, domainStr);
		} else {
			snode.setConnection(rangeSnode, domainStr);
		}
		gNodeGroup.drawNodes();
	};
	
	var launchSNodeItemDialog = function (snodeItem, draculaLabel) {
    	require([ 'sparqlgraph/js/modalitemdialog',
  	            ], function (ModalItemDialog) {
      		
      		var dialog= new ModalItemDialog(snodeItem, gNodeGroup, getQueryClientOrInterface(), snodeItemDialogCallback,
      				                        {"draculaLabel" : draculaLabel}
      		                                );
      		dialog.show();
  		});
     };
    
     var propertyItemDialogCallback = function(propItem, sparqlID, optionalFlag, delMarker, rtConstrainedFlag, constraintStr, data) {    	
    	// Note: ModalItemDialog validates that sparqlID is legal
    	
    	// update the property
    	propItem.setReturnName(sparqlID);
    	propItem.setIsOptional(optionalFlag);
    	propItem.setIsRuntimeConstrained(rtConstrainedFlag);
    	propItem.setConstraints(constraintStr);
    	propItem.setIsMarkedForDeletion(delMarker);
    	
    	// PEC TODO: pass draculaLabel through the dialog
    	displayLabelOptions(data.draculaLabel, propItem.getDisplayOptions());
    };
    
    var snodeItemDialogCallback = function(snodeItem, sparqlID, optionalFlag, delMarker, rtConstrainedFlag, constraintStr, data) {    	
    	// Note: ModalItemDialog validates that sparqlID is legal
    	
    	// don't un-set an SNode's sparqlID
    	if (sparqlID == "") {
    		snodeItem.setIsReturned(false);
    	} else {
    		snodeItem.setSparqlID(sparqlID);
        	snodeItem.setIsReturned(true);
    	}
    	
    	// ignore optionalFlag in sparqlGraph.  It is still used in sparqlForm
		
		// runtime constrained
    	snodeItem.setIsRuntimeConstrained(rtConstrainedFlag);
    	snodeItem.setDeletionMode(delMarker);

    	// constraints
    	snodeItem.setConstraints(constraintStr);
    	
    	// PEC TODO: pass draculaLabel through the dialog
    	changeLabelText(data.draculaLabel, snodeItem.getSparqlID());
    	displayLabelOptions(data.draculaLabel, snodeItem.getDisplayOptions());
    	gNodeGroup.drawNodes();
    };
    
    var downloadFile = function (data, filename) {
    	// build an anchor and click on it
		$('<a>invisible</a>')
			.attr('id','downloadFile')
			.attr('href','data:text/csv;charset=utf8,' + encodeURIComponent(data))
			.attr('download', filename)
			.appendTo('body');
		$('#downloadFile').ready(function() {
			$('#downloadFile').get(0).click();
		});
		
		// remove the evidence
		var parent = document.getElementsByTagName("body")[0];
		var child = document.getElementById("downloadFile");
		parent.removeChild(child);
    };
    
    
    var doLoad = function() {
    	logEvent("SG Menu: File->Load");
    	gLoadDialog.loadDialog(gConn, false, doLoadConnection);
    };
    
    //**** Start new load code *****//
    var doLoadOInfoSuccess = function() {
    	// now load gOInfo into gOTree
		gOTree.addOntInfo(gOInfo);
    	gOTree.showAll(); 
	    gOInfoLoadTime = new Date();
		setStatus("");
		guiTreeNonEmpty();
		//gNodeGroup.setCanvasOInfo(gOInfo);
		gMappingTab.updateNodegroup(gNodeGroup);
		gUploadTab.setNodeGroup(gConn, gNodeGroup, gMappingTab, gOInfoLoadTime);

		logEvent("SG Load Success");
    };
    
    var doLoadFailure = function(msg) {
    	require(['sparqlgraph/js/ontologyinfo'], 
   	         function () {
    		
	    	logAndAlert(msg);
	    	setStatus("");    		
	    	clearTree();
	    	gOInfo = new OntologyInfo();
		    gOInfoLoadTime = new Date();
	    	
	    	gMappingTab.updateNodegroup(gNodeGroup);
			gUploadTab.setNodeGroup(gConn, gNodeGroup, gMappingTab, gOInfoLoadTime);
		
    	});
 		// retains gConn
    };
    
    var doLoadConnection = function(connProfile, optDirectFlag, optCallback) {
    	// Callback from the load dialog
    	var callback = (typeof optCallback === "undefined") ? function(){} : optCallback;
    	var directFlag = (typeof optDirectFlag === "undefined") ? false : optDirectFlag;
    	
    	require(['sparqlgraph/js/msiclientquery',
    	         'sparqlgraph/js/backcompatutils',
    	         'jquery', 
    	         'jsonp'], function(MsiClientQuery, BCUtils) {
    		
    		
	    	// Clean out existing GUI
	    	clearEverything();
	    	
	    	// Direct load defaults to direct queries
	    	if (directFlag) {
	    		setQuerySource("DIRECT");
	    	}
	    	
	    	// Get connection info from dialog return value
	    	gConn = connProfile;
	    	gNodeGroup.setSparqlConnection(gConn);
	    	
	    	if (gConn != null) {
		    	gQueryClient = new MsiClientQuery(g.service.sparqlQuery.url, gConn.getDefaultQueryInterface());
		    	
		    	logEvent("SG Loading", "connection", gConn.toString());
		    	
		    	// load through query service unless "DIRECT"
		    	var queryServiceUrl = (directFlag) ? null : g.service.sparqlQuery.url;
		    	
		    	// note: clearEverything creates a new gOInfo
	    		BCUtils.loadSparqlConnection(gOInfo, gConn, queryServiceUrl, setStatus, function(){doLoadOInfoSuccess(); callback();}, doLoadFailure);
	    	}
    	});
    };
    
    var getQueryClientOrInterface = function() {
    	return (getQuerySource() == "DIRECT") ? gConn.getDefaultQueryInterface() : gQueryClient;
    };
    
    var doQueryLoadFile = function (file) {
    	var r = new FileReader();
    	
    	r.onload = function () {
    					
    			doQueryLoadJsonStr(r.result);
	    		
    	};
	    r.readAsText(file);
    	
    };
    
    var doQueryLoadJsonStr = function(jsonStr) {
    	require(['sparqlgraph/js/sparqlgraphjson',
                 'sparqlgraph/js/modaliidx'], 
                function(SparqlGraphJson, ModalIidx) {
			
	    	var sgJson = new SparqlGraphJson();
	    	
			try {
				sgJson.parse(jsonStr);
			} catch (e) {
				logAndAlert("Error parsing the JSON sparqlGraph file: \n" + e);
				return;
			}
			
			try {
				var conn = sgJson.getSparqlConn();
			} catch (e) {
				logAndAlert("Error reading connection from JSON file.\n" + e);
				console.log(e.stack);
				clearGraph();
			}	
            
            // is this conn different from the one already loaded
            if (gConn && ! conn.equals(gConn, true)) {
                ModalIidx.choose("New Connection",
                                 "Nodegroup is from a different SPARQL connection<br><br>Which one do you want to use?",
                                 ["Cancel",     "Keep Current",                     "Load New"],
                                 [function(){}, doQueryLoadFile2.bind(this, sgJson), doQueryLoadConn.bind(this, sgJson, conn)]
                                 );
            } else if (!gConn) {
                doQueryLoadConn(sgJson, conn);
            } else {
                doQueryLoadFile2(sgJson);
            }
		});

    };
    
    /* 
     * loads connection and makes call to load rest of sgJson
     * part of doQueryLoadJsonStr callback chain
     */
    var doQueryLoadConn = function(sgJson, conn) {
    	require(['sparqlgraph/js/sparqlgraphjson',
                 'sparqlgraph/js/modaliidx'], 
                function(SparqlGraphJson, ModalIidx) {
						
            var existName = gLoadDialog.connectionIsKnown(conn, true);     // true: make this selected in cookies
            
            // function pointer for the thing we do next no matter what happens:
            //    doLoadConnection() with doQueryLoadFile2() as the callback
            var doLoadConnectionCall = doLoadConnection.bind(this, conn, false, doQueryLoadFile2.bind(this, sgJson));
            
            if (! existName) {
                // new connection: ask if user wants to save it locally
                ModalIidx.choose("New Connection",
                                 "Connection is not saved locally.<br><br>Do you want to save it?",
                                 ["Cancel",     "Don't Save",                     "Save"],
                                 [function(){}, 
                                  doLoadConnectionCall,
                                  function(){ gLoadDialog.addConnection(conn); 
                                              doLoadConnectionCall(); 
                                            }
                                 ]
                                );

            } else {
                // conn already exists in cookies.  Use the name in cookies, so we don't get duplicates
                conn.setName(existName);
                gLoadDialog.writeProfiles();    // write so we save this as the selected connection

                // now load the right connection, then load the file
                doLoadConnectionCall();
            }
			
		});

    };

    /**
     * loads a nodegroup and importspec onto the graph
     * part of doQueryLoadJsonStr callback chain
     *
     * @param {JSON} grpJson    node group
     * @param {JSON} importJson import spec
     */
    var doQueryLoadFile2 = function(sgJson) {
    	// by the time this is called, the correct oInfo is loaded.
    	// and the gNodeGroup is empty.
    	clearGraph();
    	logEvent("SG Loaded Nodegroup");
    	sgJson.getNodeGroup(gNodeGroup, gOInfo);
	
		gNodeGroup.drawNodes();
		guiGraphNonEmpty();
		
		gMappingTab.load(gNodeGroup, sgJson.getMappingTabJson());
    };
    
    var doNodeGroupUploadCallback = function (evt) {
    	// fileInput callback
    	doQueryLoadFile(evt.target.files[0]);
    };
    
    var doNodeGroupUpload = function () {
    	// menu pick callback
    	logEvent("SG menu: File->Upload");
		if (gNodeGroup.getNodeCount() > 0) {
    		logAndAlert("Clear the current query before uploading a new one.");
    		
    	} else {
    		
	    	var fileInput = document.getElementById("fileInput");
	    	fileInput.addEventListener('change', doNodeGroupUploadCallback, false);
	    	fileInput.click();
    	}
    };
    
    var doNodeGroupDownload = function () {
    	logEvent("SG menu: File->Download");
    	if (gNodeGroup == null || gNodeGroup.getNodeCount() == 0) {
    		logAndAlert("Query canvas is empty.  Nothing to download.");
    		
    	} else {
    		require(['sparqlgraph/js/sparqlgraphjson'], function(SparqlGraphJson) {
    			// make sure importSpec is in sync
    			gMappingTab.updateNodegroup(gNodeGroup);
    			
				var sgJson = new SparqlGraphJson(gConn, gNodeGroup, gMappingTab, true);
	    		
				gMappingTab.setChangedFlag(false);	
	    		downloadFile(sgJson.stringify(), "sparql_graph.json");
    		});
    	}
    };
    
    // ======= drag-and-drop version of query-loading =======
    	
    var noOpHandler = function (evt) {
		 evt.stopPropagation();
		 evt.preventDefault();
   	};
   	
   	var fileDrop = function (evt) {
   		
   		if (! gReady) {
   			console.log("Ignoring file drop because I'm not ready.");
   			noOpHandler(evt);
   			return;
   		}
   		// drag-and-drop handler for files
   		logEvent("SG Drop Query File");
   		noOpHandler(evt);
   		var files = evt.dataTransfer.files;
   		if (gNodeGroup.getNodeCount() == 0 || confirm("Clearing current query to load new one.")) {
   			
	   		if (files.length == 1 && files[0].name.slice(-5).toLowerCase() == ".json") {
	   			var fname = files[0].name;
	   			doQueryLoadFile(files[0]);
	   		
	   		} else if (files.length != 1) {
	   			logAndAlert("Can't handle drop of " + files.length.toString() + " files.");
	   			
	   		} else {
	   			logAndAlert("Can't handle drop of file with unrecognized filename extenstion:" + files[0].name)
	   		}
    	}
   		
   	};
	
   	
   	var doTest = function () {
        alert("test");
   	};
   	
   	var doRetrieveFromNGStore = function() {
        gModalStoreDialog.launchRetrieveDialog();
    };

   	var doDeleteFromNGStore = function() {
        gModalStoreDialog.launchDeleteDialog();
    };
   	
  	var doStoreNodeGroup = function () {
  		gMappingTab.updateNodegroup(gNodeGroup);
        
        // save user when done
        var doneCallback = function () {
            localStorage.setItem("SPARQLgraph_user", gModalStoreDialog.getUser());
        }
        
		gModalStoreDialog.launchStoreDialog(gConn, gNodeGroup, gMappingTab, doneCallback); 		
  	};
  	
  	var doLayout = function() {
   		setStatus("Laying out graph...");
   		gNodeGroup.layouter.layoutLive(gNodeGroup.renderer, setStatus.bind(null, "")); 		
   	};
    
   	var doTestMsi = function () {
    	require(['sparqlgraph/js/microserviceinterface',
    	         'sparqlgraph/js/msiclientquery',
    	         'sparqlgraph/js/modaliidx'], 
    	         function (MicroServiceInterface, MsiQueryClient, ModalIidx) {
    		
			var successCallback = function (resultSet) { 
				if (! resultSet.isSuccess()) {
					ModalIidx.alert("Service failed", resultSet.getGeneralResultHtml());
				} else {
					ModalIidx.alert("ResultSet", JSON.stringify(resultSet)); 
				}
			};
			
    		var mq = new MsiQueryClient(g.service.sparqlQuery.url, gConn.getDefaultQueryInterface());
    		mq.execAuthQuery("select ?x ?y ?z where {?x ?y ?z.} limit 10", successCallback);
    	});
    	
    };
    
    // only used for non-microservice code
    // Almost DEPRECATED
    var getNamespaceFlag = function () {
		var ret = document.getElementById("SGQueryNamespace").checked? SparqlServerResult.prototype.NAMESPACE_YES: SparqlServerResult.prototype.NAMESPACE_NO;
		// for sparqlgraph we always want raw HTML in the results.  No links or markup, etc.
		return ret + SparqlServerResult.prototype.ESCAPE_HTML;
    };
    
    /** Get query options **/
    
    // returns "SELECT", "COUNT", "CONSTRUCT", or "DELETE"
    var getQueryType = function () {
    	var s = document.getElementById("SGQueryType");
    	return s.options[s.selectedIndex].value;
    };
    
    // returns "QUERY_SERVICE", "DIRECT", or "DISPATCHER"
    var getQuerySource = function () {
    	var s = document.getElementById("SGQuerySource");
    	return s.options[s.selectedIndex].value;
    };
    
    var getQueryLimit = function () {
    	// input already guarantees only digits
    	var value = document.getElementById("SGQueryLimit").value;
    	if (value.length == 0) {
    		return  0;
    	} else {
    		return parseInt(value);
    	}
    };
    
    var setQuerySource = function (val) {
    	var s = document.getElementById("SGQuerySource");
    	
		for (var i=0; i < s.options.length; i++) {
			s.options[i].selected = (s.options[i].value==val);
		}
    };
    
    var getQueryShowNamespace = function () {
    	return document.getElementById("SGQueryNamespace").checked;
    };
    
    var legalQueryTypeSourceCombo = function (qType, qSource) {
    	switch (qSource) {
    	case "DIRECT":
    		return (qType != "DELETE");
    		break;
    	case "DISPATCHER":
    		return (qType == "SELECT");
    		break;
    	default:
    		return true;
    	}
    };
    
    var onchangeQueryType = function () {
    	// clear query test
    	document.getElementById('queryText').value = "";
    	
    	var qType = getQueryType();  // gets new one?
    	
    	// check query source
    	var s = document.getElementById("SGQuerySource");
		for (var i=0; i < s.options.length; i++) {
			s.options[i].disabled = !legalQueryTypeSourceCombo(qType, s.options[i].value);
		}

    };
    
    var onchangeQuerySource = function () {
    	
    	var qSource = getQuerySource();  // gets new one?

    	// check query type
    	var s = document.getElementById("SGQueryType");
    	
		for (var i=0; i < s.options.length; i++) {
			s.options[i].disabled = !legalQueryTypeSourceCombo(s.options[i].value, qSource);
		}
    	
    };
    
    var doUnload = function () {
    	clearEverything();
    	
    	gMappingTab.updateNodegroup(gNodeGroup);
		gUploadTab.setNodeGroup(gConn, gNodeGroup, gMappingTab, gOInfoLoadTime);
    };
    
    var doSearch = function() {
    	gOTree.find($("#search").val());
    };
    
    var doCollapse = function() {
    	document.getElementById("search").value="";
    	gOTree.collapseAll();
    };
    
    var doExpand = function() {
    	gOTree.expandAll();
    };
     
    var setStatus = function(msg) {
    	document.getElementById("status").innerHTML= "<font color='red'>" + msg + "</font><br>";
    };
    
    var setStatusProgressBar = function(msg, percent) {
		var p = (typeof percent === 'undefined') ? 50 : percent;

		document.getElementById("status").innerHTML = msg
				+ '<div class="progress progress-info progress-striped active"> \n'
				+ '  <div class="bar" style="width: ' + p
				+ '%;"></div></div>';
	};
	
    var graphExecute = function() {
    	logEvent("SG Execute");
    	buildQuery();
    	
    	var query = document.getElementById('queryText').value
    	
    	if (query.match("#Error")) {
    		var q = query.split('\n');
    		var msg = "Invalid query:";
    		var i = 0;
    		while (q[i].match("#Error")) {
    			msg += "\n- " + q[i].slice(7);
    			i += 1;
    		}
    		logAndAlert(msg);
    	} else {
    		runQuery();
    	}
    };
    
    var buildQuery = function() {
    	logEvent("SG Build");
        var sparql = "";
        
        switch (getQueryType()) {
        case "SELECT":
        	sparql = gNodeGroup.generateSparql(SemanticNodeGroup.QUERY_DISTINCT, false, getQueryLimit());
        	break;
        case "COUNT":
        	sparql = gNodeGroup.generateSparql(SemanticNodeGroup.QUERY_COUNT, false, getQueryLimit());
        	break;
        case "CONSTRUCT":
        	sparql = gNodeGroup.generateSparqlConstruct();
        	break;
        case "DELETE":
        	sparql = gNodeGroup.generateSparqlDelete("", null);
        	break;
        default:
        	throw new Error("Unknown query type.");	
        }
        
        document.getElementById('queryText').value = sparql;

        guiQueryNonEmpty();
        
    };
    
    var constructQryCallback = function(qsresult) {
    	// HTML: tell user query is done
		setStatus("");
		
		if (qsresult.isSuccess()) {
			// try drawing the result to the graph
			this.gNodeGroup.clear();
			this.gNodeGroup.fromConstructJson(qsresult.getAtGraph(), gOInfo);
			this.gNodeGroup.drawNodes();
		}
		else {
			logAndAlert(qsresult.getStatusMessage());
		}
    
    
    };
    
    var runQuery = function () {
    	
    	var query = document.getElementById("queryText").value;
    	logEvent("SG Run Query", "sparql", query);
    	
    	

		if (query.length < 1) {
			logAndAlert("Can't run empty query.  Use 'build' button first.");
			
		} else {
			
			clearResults();
			
			switch (getQueryType()) {
			case "SELECT":
			case "COUNT" :
			case "CONSTRUCT":
				switch (getQuerySource()) {
				case "DIRECT":
					setStatusProgressBar("running DIRECT query...", 50);
					guiDisableAll();
					
					require(['sparqlgraph/js/sparqlserverinterface',
			    	        ], function(SparqlServerInterface) {
						
						gConn.getDefaultQueryInterface().executeAndParse(query, runQueryCallback);
					});
			    	
					break;
					
				case "QUERY_SERVICE":
					setStatusProgressBar("running query...", 50);
					guiDisableAll();
					
					gQueryClient.executeAndParse(query, runQueryCallback);
					break;
					
				case "DISPATCHER":	
					try {
						// might not be defined for some os installations
						doDispatcherQuery();
					} catch (e) {
		    			throw new Error("Can't run query of type " + getQuerySource());
		    		}
					break;
				}
				break;
				
			case "DELETE":
				
				switch (getQuerySource()) {
				case "DIRECT":
					logAndAlert("Auth queries direct to triplestore are not implemented.");
					break;
				
				case "QUERY_SERVICE":
					require([ 'sparqlgraph/js/modaliidx'], function (ModalIidx) {
						
						var authQuery = function () {
							setStatus("running delete query...");
							guiDisableAll();
							gQueryClient.execAuthQuery(query, runNoResultsQueryCallback);
						}
						
						ModalIidx.okCancel(	"Auth Query", 
											"About to run auth query which will modify data.<p>Hit 'Run' to confirm.", 
											authQuery, 
											"Run");
					});
					break;
					
				case "DISPATCHER":
					logAndAlert("Auth queries can not be executed through a dispatcher.");
					break;
				}
				break;
			}
		}
	};
		
	// The query callback  
	var runQueryCallback = function(results) {
	
		// HTML: tell user query is done
		setStatus("");
		guiUnDisableAll();
		
		if (results.isSuccess()) {
   	
			logEvent("SG Display Query Results", "rows", results.getRowCount());
			
			if (getQuerySource() == "DIRECT") {
				/* old non-microservice */
				results.getResultsInDatagridDiv(	document.getElementById("resultsParagraph"), 
													"resultsTableName",
													"resultsTableId",
													"table table-bordered table-condensed", 
													results.getRowCount() > 10, // filter flag
													"gQueryResults",
													null,
													null,
													getNamespaceFlag());
			} 
			else {
			    // new microservice results grid functionality
				results.setLocalUriFlag(! getQueryShowNamespace());
				results.setEscapeHtmlFlag(true);
				results.putTableResultsDatagridInDiv(document.getElementById("resultsParagraph"), "");
			}
			
			guiResultsNonEmpty();
			
			gQueryResults = results;

		}
		else {
			logAndAlert(results.getStatusMessage());
		}
	};
	
	// The query callback for anything where no results are expected
	var runNoResultsQueryCallback = function(results) {
	
		// HTML: tell user query is done
		setStatus("");
		guiUnDisableAll();
		
		if (results.isSuccess()) {
			var res = results.getRsData(0,0);
			
			gQueryResults = null;
			guiResultsEmpty();
			
			document.getElementById("resultsParagraph").innerHTML = 	'<div class="alert alert-info"> <strong>Query Response</strong><p>' + res + '</div>';
		}
		else {
			logAndAlert(results.getStatusMessage());
		}
	};
	
	// Gui Functions
    // Inform the GUI which sections are empty
    // NOT Nested
    
	var guiTreeNonEmpty = function () {
    	document.getElementById("btnTreeExpand").className = "btn";
    	document.getElementById("btnTreeExpand").disabled = false;
    	
    	document.getElementById("btnTreeCollapse").className = "btn";
    	document.getElementById("btnTreeCollapse").disabled = false;

    };
    
    var guiTreeEmpty = function () {
    	document.getElementById("btnTreeExpand").className = "btn disabled";
    	document.getElementById("btnTreeExpand").disabled = true;
    	
    	document.getElementById("btnTreeCollapse").className = "btn disabled";
    	document.getElementById("btnTreeCollapse").disabled = true;
    };
   
    var guiGraphNonEmpty = function () {
    	document.getElementById("btnLayout").className = "btn";
    	document.getElementById("btnLayout").disabled = false;
    	
    	document.getElementById("btnGraphClear").className = "btn";
    	document.getElementById("btnGraphClear").disabled = false;
    	
    	document.getElementById("btnGraphExecute").className = "btn";
    	document.getElementById("btnGraphExecute").disabled = false;
    	
    	document.getElementById("btnQueryBuild").className = "btn";
    	document.getElementById("btnQueryBuild").disabled = false;

    };
    
    var giuGraphEmpty = function () {
    	document.getElementById("btnLayout").className = "btn disabled";
    	document.getElementById("btnLayout").disabled = true;
    	
    	document.getElementById("btnGraphClear").className = "btn disabled";
    	document.getElementById("btnGraphClear").disabled = true;
    	
    	document.getElementById("btnGraphExecute").className = "btn disabled";
    	document.getElementById("btnGraphExecute").disabled = true;
    	
    	document.getElementById("btnQueryBuild").className = "btn disabled";
    	document.getElementById("btnQueryBuild").disabled = true;

    };
    
    var guiQueryEmpty = function () {
    	document.getElementById("btnQueryRun").className = "btn disabled";
    	document.getElementById("btnQueryRun").disabled = true;
    };
    
    var guiQueryNonEmpty = function () {
    	document.getElementById("btnQueryRun").className = "btn-primary";
    	document.getElementById("btnQueryRun").disabled = false;
    };
    
    var guiResultsEmpty = function () {
    	//document.getElementById("btnDownloadCSV").className = "btn disabled";
    	//document.getElementById("btnDownloadCSV").disabled = true;
    };
    
    var guiResultsNonEmpty = function () {
    	
    	//document.getElementById("btnDownloadCSV").className = "btn";
    	//document.getElementById("btnDownloadCSV").disabled = false;
    };
	
    var classHash = {};
    var disableHash = {};
    
    var guiDisableAll = function () {
    	classHash = {};
        disableHash = {};
        
    	var buttons = document.getElementsByTagName("button");
        for (var i = 0; i < buttons.length; i++) {
        	
        	classHash[buttons[i].id] = buttons[i].className;
            disableHash[buttons[i].id] = buttons[i].disabled;
            
        	buttons[i].className = "btn disabled";
            buttons[i].disabled = true;
        }
    };
    
    var guiUnDisableAll = function () {
    	var buttons = document.getElementsByTagName("button");
        for (var i = 0; i < buttons.length; i++) {
        	buttons[i].className = classHash[buttons[i].id];
            buttons[i].disabled =  disableHash[buttons[i].id];
        }
    };
    
	// Clear functions
	// NESTED:  Each one clears other things that depend upon it.
    var clearResults = function () {
		document.getElementById("resultsParagraph").innerHTML = "<table id='resultsTable'></table>";
		gQueryResults = null;
		gTimeseriesResults = null;
		guiResultsEmpty();
	};
    
	var clearQuery = function () {
	 	document.getElementById('queryText').value = "";
	 	
	 	document.getElementById('SGQueryType').selectedIndex = 0;
	 	document.getElementById('SGQuerySource').selectedIndex = 0;
	 	document.getElementById('SGQueryLimit').value = "1000";
	 	document.getElementById('SGQueryNamespace').checked = true;
	 	
	 	clearResults();
	 	guiQueryEmpty();
	};
	
	var clearGraph = function () {
    	gNodeGroup.clear();
    	clearQuery();
    	giuGraphEmpty();
    };
    
    var clearMappingTab = function () {
       gMappingTab.clear();
    };
    
    var clearTree = function () {
    	gOTree.removeAll();
    	clearGraph();
    	guiTreeEmpty();  //guiTreeEmpty();
    	clearMappingTab();

    };
    
    var clearEverything = function () {
    	clearTree();
    	gOInfo = new OntologyInfo();
    	gConn = null;
	    gOInfoLoadTime = new Date();
    };
    
	// ===  Tabs ====
	$(function() {
		$( "#tabs" ).tabs({
		    activate: function(event) {
		        // Enable / disable buttons on the navigation bar
		        if (event.currentTarget.id == "anchorTab1") {
		        	tabSparqlGraphActivated();
		        	
		        } else if (event.currentTarget.id == "anchorTab2") {
		        	tabMappingActivated();
		     
			    } else if (event.currentTarget.id == "anchorTab3") {
		        	tabUploadActivated();
		        }
		    }
		});
	});
	
	var tabSparqlGraphActivated = function() {
		 gCurrentTab = g.tab.query;
		 this.document.getElementById("query-tab-but").disabled = true;
		 this.document.getElementById("mapping-tab-but").disabled = false;
		 this.document.getElementById("upload-tab-but").disabled = false;

	};
	
	var tabMappingActivated = function() {
		gCurrentTab = g.tab.mapping;
		
		this.document.getElementById("query-tab-but").disabled = false;
		this.document.getElementById("mapping-tab-but").disabled = true;
		this.document.getElementById("upload-tab-but").disabled = false;
		
		// PEC TODO: this overwrites everything each time
		gMappingTab.updateNodegroup(gNodeGroup);
	};
	
	var tabUploadActivated = function() {
		 gCurrentTab = g.tab.upload;
		 
		 this.document.getElementById("query-tab-but").disabled = false;
		 this.document.getElementById("mapping-tab-but").disabled = false;
		 this.document.getElementById("upload-tab-but").disabled = true;
		 
		 gUploadTab.setNodeGroup(gConn, gNodeGroup, gMappingTab, gOInfoLoadTime);

	};