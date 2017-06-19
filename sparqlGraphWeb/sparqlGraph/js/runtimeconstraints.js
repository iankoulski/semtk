/**
 ** Copyright 2016 General Electric Company
 **
 ** Authors:  Paul Cuddihy, Justin McHugh, Jenny Williams
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
        
			// shimmed
			
		],


	function() {
	
		/**
		 * Runtime constraints object
         * TODO flesh this out with full runtime constraint functionality
		 */
		var RuntimeConstraints = function () {
            this.json = null;
		};
			
		RuntimeConstraints.prototype = {
			//
			// NOTE any methods without jsdoc comments is NOT meant to be used by API users.
			//      These methods' behaviors are not guaranteed to be stable in future releases.
			//
			
			fromJson : function (jObj) {  
                alert("fromJson..." + jObj);
                this.json = jObj;
			},
			
            toJson : function () {
                return this.json;
			},
		};
	
		return RuntimeConstraints;            // return the constructor
	}
);