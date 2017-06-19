/**
 ** Copyright 2016 General Electric Company
 **
 ** Authors:  Paul Cuddihy, Jenny Williams
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


define([	// properly require.config'ed
    'sparqlgraph/js/msiclientnodegroupstore',
    'sparqlgraph/js/modaliidx',
    'sparqlgraph/js/iidxhelper',
    'sparqlgraph/js/sparqlgraphjson',

    // shimmed
    'jquery'
    ],

	function(MsiClientNodeGroupStore, ModalIidx, IIDXHelper, SelectTable, SparqlGraphJson, jquery) {
	
        // legal operations for runtime constraints
        var operationsArray = ["MATCHES", "MATCHES",
				               "REGEX", "REGEX",
				               "GREATERTHAN", "GREATERTHAN",
                               "GREATERTHANOREQUALS", "GREATERTHANOREQUALS",
                               "LESSTHAN", "LESSTHAN",
                               "LESSTHANOREQUALS", "LESSTHANOREQUALS",
                               "VALUEBETWEEN", "VALUEBETWEEN",
                               "VALUEBETWEENUNINCLUSIVE", "VALUEBETWEENUNINCLUSIVE"];
    
		/**
		 * A dialog allowing users to populate runtime constraints.
         * Callback provides json for runtime constraint object.  Sample: 
		 */
		var ModalRuntimeConstraintDialog= function () {
            this.div = null;
            this.sparqlIDs = null;
            this.callback = function () {};
		};		
		
		ModalRuntimeConstraintDialog.prototype = {
            
            show : function () {
                IIDXHelper.showDiv(this.div);
            },
            
            hide : function () {
                IIDXHelper.hideDiv(this.div);
            },
            
            clearCallback : function() {
                alert("clearCallback...do something");
			},
            
            // TODO add validations - and if fails return a string indicating the error
            validateCallback : function() {
				return null;
			},
			
            /**
             * Build runtime constraint json and return it
             */
			okCallback : function() {
                
                // TODO move this code to its own function  
                // TODO needs to vary by data type
                var runtimeConstraintJsonString = "RuntimeConstraints: [";                
                // for each sparql id, add to json
                for(i = 0; i < this.sparqlIDs.length; i++){
                    var sparqlId = this.sparqlIDs[i];
                    var operand = document.getElementById("operand" + sparqlId).value;
                    if(operand.trim()){
                        runtimeConstraintJsonString += '{"SparqlID": "' + sparqlId + '",';
                        runtimeConstraintJsonString += '"Operator":"MATCHES",';  // TODO unhardcode
                        runtimeConstraintJsonString += '"Operands":["' + operand + '"] }, ';
                    }
                }
                runtimeConstraintJsonString += "]";
                
                this.callback(runtimeConstraintJsonString);
			},
			
			cancelCallback : function() {
                
            },
            
            /**
              * Got runtime constraints for the node group.  Launch dialog.
              */
            launchRuntimeConstraintCallback : function (multiFlag, resultSet) { 
				if (! resultSet.isSuccess()) {
					ModalIidx.alert("Service failed", resultSet.getGeneralResultHtml());
				} else {

                    this.div = document.createElement("div");
                    var form = IIDXHelper.buildHorizontalForm();
                    this.div.appendChild(form);
                    var fieldset = IIDXHelper.addFieldset(form);

                    // create operator/operand inputs for each runtime-constrained sparql id 
                    // TODO needs better formatting, including for different types
                    this.sparqlIDs = resultSet.getColumnStringsByName("valueId");
                    for(i = 0; i < this.sparqlIDs.length; i++){
                        fieldset.appendChild(IIDXHelper.buildControlGroup(this.sparqlIDs[i] + " operator:", IIDXHelper.createSelect("ModalRuntimeConstraintDialog.select", operationsArray)));
                        fieldset.appendChild(IIDXHelper.buildControlGroup(this.sparqlIDs[i] + " operand:", IIDXHelper.createTextInput("operand" + this.sparqlIDs[i])));  // e.g. operand?trNum
                    }
                    
                    // launch the modal
                    var m = new ModalIidx();                            
                    m.showClearCancelSubmit(
                                    this.title,
                                    this.div, 
                                    this.validateCallback,
                                    this.clearCallback, 
                                    this.okCallback.bind(this)
                                    );
				}
			},            
                        
            /**
              *  Call nodegroup store to get runtime constraints for the given nodegroup id
              *  Then launch dialog with callback linked to "OK"
              */
            launchDialogById : function (nodegroupId, callback, multiFlag) {
                this.title = "Enter runtime constraints";
                this.callback = callback;

                var mq = new MsiClientNodeGroupStore(g.service.nodeGroupStore.url);
    		    mq.getNodeGroupRuntimeConstraints(nodegroupId, this.launchRuntimeConstraintCallback.bind(this, multiFlag));
            },
            
            // TODO add launchDialogByNodegroup
            
		};
	
		return ModalRuntimeConstraintDialog;
	}
);