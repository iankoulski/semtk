/**
 ** Copyright 2016 General Electric Company
 **
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


package com.ge.research.semtk.ontologyTools;

public class Triple {
	
	private String[] triple;
	
	// constructor
	public Triple(String s, String p, String o){
		this.triple = new String[3];
		this.triple[0] = s;
		this.triple[1] = p;
		this.triple[2] = o;
	}
	
	public Triple(){
		this.triple = new String[3];
	}
	
	public String getSubject(){
		return this.triple[0];
	}
	
	public String getObject(){
		return this.triple[2];
	}
	
	public String getPredicate(){
		return this.triple[1];
	}
	
	public void setSubject(String s){
		this.triple[0] = s;
	}
	
	public void setPredicate(String p){
		this.triple[1] = p;
	}
	
	public void setObject(String o){
		this.triple[2] = o;
	}
}
