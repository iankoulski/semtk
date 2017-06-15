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

define([	// properly require.config'ed   bootstrap-modal
        	'sparqlgraph/js/iidxhelper',
        	'jquery',
        	'bootstrap/bootstrap-modal',
         	'bootstrap/bootstrap-transition',
         	
			// shimmed
            // 'logconfig',
		],

	function(IIDXHelper, $) {
	
		/*
		 *    A column name or text or some item used to build a triple value
		 */
		var ModalIidx = function (optUniqueId) {
			// optUniqueId is the html element id.  Only needed if there is a conflict or nested modals.
			this.id = (typeof optUniqueId !== "undefined") ? optUniqueId : "myModal";
			this.div = null;
		};
		
		ModalIidx.CONSTANT = "text";
		
		ModalIidx.HTML_SAFE = true;      // flag: disrespect anything that looks like html markup.  Show raw tag characters
		ModalIidx.HTML_ALLOW = false;    //       respect html markup.
		
		ModalIidx.alert = function (titleTxt, msgHtml, cleanHtmlFlag) {
			// clean up the html tags if flag is set
			var msgHtml2 = (typeof cleanHtmlFlag === "undefined" || ! cleanHtmlFlag) ? msgHtml : IIDXHelper.htmlSafe(msgHtml);
			
			// simple alert dialog
		    kdlLogEvent("Alert", "title", titleTxt, "message", msgHtml);

			var m = new ModalIidx("ModalIidxAlert");
			var div = document.createElement("div");
			div.innerHTML = msgHtml2;
			m.showOK(titleTxt, div, function(){});
		};
		
		ModalIidx.okCancel = function (titleTxt, msgHtml, okCallback, optOkButtonText) {
			// ok cancel
		    kdlLogEvent("OkCancel", "title", titleTxt, "message", msgHtml);

			var m = new ModalIidx("ModalIidxOkCancel");
			var div = document.createElement("div");
			div.innerHTML = msgHtml;
			m.showOKCancel(	titleTxt, 
							div, 
							function() {return null;}, // always validate
							okCallback, 
							function () {},    // no cancel callback
							optOkButtonText
							);
		};
		
		// untested
		ModalIidx.prompt = function (titleText, msgHtml, okCallback) {
			kdlLogEvent("prompt", "title", titleTxt, "message", msgHtml);

			var m = new ModalIidx("ModalIidxPrompt");
			var div = document.createElement("div");
			div.innerHTML = msgHtml + " " + '<input type="text" class="input-xlarge" id="modalIidxPrompt" >';
			m.showOKCancel(	titleTxt, 
							div, 
							function() {return null;}, // always validate
							okCallback(document.getElementById("modalIidxPrompt").value), 
							function () {},    // no cancel callback
							optOkButtonText
							);
		};
		
		ModalIidx.clearCancelSubmit = function (titleTxt, dom, clearCallback, submitCallback, optOKButText, optWidthPercent) {
			
		    kdlLogEvent("clearCancelSubmit", "title", titleTxt);

			var div = document.createElement("div");
			div.appendChild(dom);
			
			var m = new ModalIidx("clearCancelSubmit");
			m.showClearCancelSubmit(titleTxt, 
									div, 
									function() {return null;},     // validation is not implemented for this one
									clearCallback, 
									submitCallback,
									optOKButText,
									optWidthPercent
									);
		};
		
		/**
		 * Show a select,
		 * submitCallback(v)  where v is selected value or null.
		 */
		ModalIidx.selectOption = function (titleTxt, textValArray, submitCallback, optOKButText, optWidthPercent) {
			kdlLogEvent("selectOption", "title", titleTxt);
			var div = document.createElement("div");
			var select = IIDXHelper.createSelect("mdSelectOption_select", textValArray);
			select.size="20";
			select.style.width = "95%";
			div.appendChild(select);
			
			var m = new ModalIidx("selectOption");
			m.showClearCancelSubmit(titleTxt,
									div,
									function() {return null;},
									function() {select.selectedIndex = -1; },
									function() {
										var val = select.selectedIndex == -1 ? null : select.options[select.selectedIndex].value;
										submitCallback(val);
									},
									optOKButText,
									optWidthPercent
									);
		};
    
        ModalIidx.choose = function (headerText, msgHtml, buttonNameList, callbackList, optWidthPercent) {
            kdlLogEvent("choicesDialog", "title", headerText);
			var div = document.createElement("div");
            div.innerHTML = msgHtml;
            
            var m = new ModalIidx("ModalIidx_choicesDialog");
            m.showChoices(headerText, div, buttonNameList, callbackList, optWidthPercent);
        };

		
		ModalIidx.prototype = {
            showOK : function (headerText, bodyDOM, callback, optWidthPercent) {
                // show a modal with header, body and callback.

                this.div = this.createModalDiv(optWidthPercent);

                if (headerText && headerText.length > 0) {
                    var header = this.createHeader(headerText);
                    this.div.appendChild(header);
                }

                //----- body -----
                var body = document.createElement("div");
                body.className="modal-body";
                body.appendChild(bodyDOM);
                this.div.appendChild(body);

                var footer = this.createOKFooter(callback);
                this.div.appendChild(footer);

                $(this.div).modal('show');
            },

            showOKCancel : function (headerText, bodyDOM, validate, callbackSuccess, callbackCancel, optOkButtonText, optWidthPercent) {
                // show a modal with header, body and callback.
                // validate must return one of:
                //      error message : display an alert
                //      null : call callbackSuccess

                var okButText = (typeof optOkButtonText == "undefined") ? "OK" : optOkButtonText;
                this.div = this.createModalDiv(optWidthPercent);

                var header = this.createHeader(headerText);
                this.div.appendChild(header);

                //----- body -----
                var body = document.createElement("div");
                body.className="modal-body";
                body.appendChild(bodyDOM);
                this.div.appendChild(body);

                var footer = this.createFooter("Cancel", callbackCancel, okButText, validate, callbackSuccess);
                this.div.appendChild(footer);

                $(this.div).modal('show');
            },

            showClearCancelSubmit : function (headerText, bodyDOM, validateCallback, clearCallback, submitCallback, optOkButtonText, optWidthPercent) {
                // show a modal with header, body and callback.
                // validate must return one of:
                //      error message : display an alert
                //      null : call callbackSuccess

                var okButText = (typeof optOkButtonText == "undefined") ? "OK" : optOkButtonText;
                this.div = this.createModalDiv(optWidthPercent);

                var header = this.createHeader(headerText);
                this.div.appendChild(header);

                //----- body -----
                var body = document.createElement("div");
                body.className="modal-body";
                body.appendChild(bodyDOM);
                this.div.appendChild(body);

                var footer = this.createClearCancelSubmitFooter(clearCallback, validateCallback, submitCallback);
                this.div.appendChild(footer);

                $(this.div).modal('show');
            },

            showChoices : function (headerText, bodyDOM, buttonNameList, callbackList, optWidthPercent) {
                // show modal with optional number of buttons
                // matching number of callbacks
                // no validation functionality
                // last button is the primary choice

                this.div = this.createModalDiv(optWidthPercent);

                var header = this.createHeader(headerText);
                this.div.appendChild(header);

                //----- body -----
                var body = document.createElement("div");
                body.className="modal-body";
                body.appendChild(bodyDOM);
                this.div.appendChild(body);

                
                // make the last button the default and "cancel" danger style
                var classList = [];
                for (var i=0; i < buttonNameList.length; i++) {
                    if (buttonNameList[i].toLowerCase() == "cancel") {
                        classList.push("btn-danger");
                    } else if (i == buttonNameList.length - 1) {
                        classList.push("btn-primary");
                    } else {
                        classList.push("");
                    }
                }
                
                // ----- footer -----
                var footer = this.createChoicesFooter(buttonNameList, callbackList, classList);
                this.div.appendChild(footer);

                $(this.div).modal('show');
            },

            createModalDiv : function (optWidthPercent) {
                // make sure modal exists and is attached to document.body

                // get rid of modal <div> if it already exists
                var leftover = document.getElementById(this.id);
                if (leftover) {
                    document.body.removeChild(leftover);
                }

                // create the modal div
                var modal = document.createElement("div");
                modal.className = "modal hide fade";
                var style = "display: none;";

                if (typeof optWidthPercent != "undefined") {
                    modal.style.margin = "0 auto auto 0";
                    modal.style.width = optWidthPercent + "%";
                    modal.style.left = (100 - optWidthPercent)/2 + "%";
                    style += "margin: 0 auto auto 0; width: " + optWidthPercent + "%; left: " + (100 - optWidthPercent)/2 + "%;";
                }

                modal.id = this.id;
                document.body.appendChild(modal);

                return modal;
            },

            createHeader : function(title) {
                //----- header -----
                var header = document.createElement("div");
                header.className="modal-header";

                var h3 = document.createElement("h3");
                h3.innerHTML = title;
                header.appendChild(h3);

                return header;
            },

            createOKFooter : function(callback) {
                //----- footer -----
                var footer = document.createElement("div");
                footer.className = "modal-footer";

                var a = document.createElement("a");
                a.className = "btn btn-primary";
                a.innerHTML = "OK";
                a.onclick = function () {
                    callback();
                    $(this.div).modal('hide');
                }.bind(this);
                footer.appendChild(a);

                return footer;
            },

            createClearCancelSubmitFooter : function(clearCallback, validateCallback, submitCallback) {
                //----- footer -----
                var footer = document.createElement("div");
                footer.className = "modal-footer";

                var a1 = document.createElement("a");
                a1.className = "btn";
                //a1.setAttribute("data-dismiss", "modal");
                a1.innerHTML = "Clear";
                a1.onclick = function () {
                    clearCallback();
                    return false;
                }
                footer.appendChild(a1);

                var a2 = document.createElement("a");
                a2.className = "btn btn-danger";
                a2.innerHTML = "Cancel";
                a2.onclick = function () {
                    $(this.div).modal('hide');
                }.bind(this);
                footer.appendChild(a2);

                var a3 = document.createElement("a");
                a3.className = "btn btn-primary";
                a3.innerHTML = "Submit";
                a3.onclick = function () {
                    var msg = validateCallback();
                    if (msg) {
                        alert(msg);
                    } else {
                        submitCallback();
                        $(this.div).modal('hide');
                    }
                }.bind(this);
                footer.appendChild(a3);
                return footer;
            },

            createFooter : function(but1text, callback1, but2text, validate2, callback2) {
                //----- footer -----
                var footer = document.createElement("div");
                footer.className = "modal-footer";

                var a1 = document.createElement("a");
                a1.className = "btn";
                a1.setAttribute("data-dismiss", "modal");
                a1.innerHTML = but1text;
                a1.onclick = callback1;
                footer.appendChild(a1);

                var a2 = document.createElement("a");
                a2.className = "btn btn-primary";
                a2.innerHTML = but2text;
                a2.onclick = function () {
                    var msg = validate2();
                    if (msg) {
                        alert(msg);
                    } else {
                        callback2();
                        $(this.div).modal('hide');
                    }
                }.bind(this);
                footer.appendChild(a2);

                return footer;
            },

            /**
              *  Create arbitrary number of buttons.
              *  All buttons hide the dialog when clicked.
              *  classList has extra classes for each button:
              *      - ""
              *      - btn-primary
              *      - btn-danger
             **/
            createChoicesFooter : function(buttonNameList, callbackList, classList) {
                var footer = document.createElement("div");
                footer.className = "modal-footer";

                for (var i=0; i < buttonNameList.length; i++) {
                    var a1 = document.createElement("a");
                    a1.classList.add("btn");
                    if (classList[i].length > 0) {
                        a1.classList.add(classList[i]);
                    }
                    a1.setAttribute("data-dismiss", "modal");
                    a1.innerHTML = buttonNameList[i];
                    
                    a1.onclick = function (callback) {
                        callback();
                        $(this.div).modal('hide');
                    }.bind(this, callbackList[i]);
                    
                    footer.appendChild(a1);
                }

                return footer;
            },
		};
	
		return ModalIidx;            // return the constructor
	}
);