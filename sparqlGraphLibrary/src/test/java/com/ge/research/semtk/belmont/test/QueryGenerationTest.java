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

package com.ge.research.semtk.belmont.test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;

import org.junit.Test;

import com.ge.research.semtk.belmont.Node;
import com.ge.research.semtk.belmont.NodeGroup;
import com.ge.research.semtk.belmont.PropertyItem;
import com.ge.research.semtk.ontologyTools.OntologyInfo;

public class QueryGenerationTest {

	@Test
	public void generateInsertQuery() throws Exception {
		System.out.println("Insert query generation test");
		
		NodeGroup ng = new NodeGroup();
		
		PropertyItem prop = new PropertyItem("testProperty", "int", "foo", "http://knowledge.ge.com/bar#foo");
		
		prop.setSparqlID("?foo");
		prop.addInstanceValue("2");
		prop.addInstanceValue("123543");
		
		PropertyItem prop2 = new PropertyItem("anotherTest", "string", "foostr", "http://knowledge.ge.com/bar#foostr");
		
		prop2.setSparqlID("?foostr");
		prop2.addInstanceValue("testvalue");
		prop2.addInstanceValue("anothertest");
		
		ArrayList<PropertyItem> props = new ArrayList<PropertyItem>();
		props.add(prop);
		props.add(prop2);
		
		Node node = new Node("testNode", props, null, "http://knowledge.ge.com/bar", ng);
		
		ng.addOneNode(node, null, null, null);		
		OntologyInfo oInfo = new OntologyInfo();
		String insertQuery = ng.generateSparqlInsert(oInfo);
		
		String expected = "prefix generateSparqlInsert:<belmont/generateSparqlInsert#>\n" +
				"prefix XMLSchema:<http://www.w3.org/2001/XMLSchema#>\n" +
				"prefix bar:<http://knowledge.ge.com/bar#>\n" +
				" INSERT {\n" +
				" ?testNode a http://knowledge.ge.com/bar .\n" +
				"        ?testNode bar:foo \"2\"^^XMLSchema:int .\n" +
				"        ?testNode bar:foo \"123543\"^^XMLSchema:int .\n" +
				"        ?testNode bar:foostr \"testvalue\"^^XMLSchema:string .\n" +
				"        ?testNode bar:foostr \"anothertest\"^^XMLSchema:string .\n" +
				"} WHERE {       BIND (iri(concat(\"generateSparqlInsert:\"";  // what follows is a unique string that we can't compare
		assertTrue(insertQuery.replaceAll("\\s+","").startsWith(expected.replaceAll("\\s+",""))); // ignore whitespace
		
	}

	
	@Test
	public void generateInsertQueryWithNodeInstanceValue() throws Exception {
		System.out.println("Insert query generation test");
		
		NodeGroup ng = new NodeGroup();
		
		PropertyItem prop = new PropertyItem("testProperty", "int", "foo", "http://knowledge.ge.com/bar#foo");
		
		prop.setSparqlID("?foo");
		prop.addInstanceValue("2");
		prop.addInstanceValue("123543");
		
		PropertyItem prop2 = new PropertyItem("anotherTest", "string", "foostr", "http://knowledge.ge.com/bar#foostr");
		
		prop2.setSparqlID("?foostr");
		prop2.addInstanceValue("testvalue");
		prop2.addInstanceValue("anothertest");
		
		ArrayList<PropertyItem> props = new ArrayList<PropertyItem>();
		props.add(prop);
		props.add(prop2);
		
		Node node = new Node("testNode", props, null, "http://knowledge.ge.com/bar", ng);
		node.setInstanceValue("http://knowledge.ge.com/bar#testInstance");

		ng.addOneNode(node, null, null, null);
		OntologyInfo oInfo = new OntologyInfo();
		
		String insertQuery = ng.generateSparqlInsert(oInfo);
		String expected = "prefix generateSparqlInsert:<belmont/generateSparqlInsert#>" +
			"prefix XMLSchema:<http://www.w3.org/2001/XMLSchema#>" +
			"prefix bar:<http://knowledge.ge.com/bar#>" +
			"INSERT {" +
			"?testNode a http://knowledge.ge.com/bar ." +
			"?testNode bar:foo \"2\"^^XMLSchema:int ." +
			"?testNode bar:foo \"123543\"^^XMLSchema:int ." +
			"?testNode bar:foostr \"testvalue\"^^XMLSchema:string ." +
			"?testNode bar:foostr \"anothertest\"^^XMLSchema:string ." +
			"} WHERE {       BIND (bar:testInstance AS ?testNode)." +
			"}";

		assertEquals(insertQuery.replaceAll("\\s+",""),(expected.replaceAll("\\s+",""))); // ignore whitespace
	}
	
	@Test
	public void generateCompoundInsertQuery() throws Exception {
		System.out.println("Compound insert query generation test");
		
		NodeGroup ng = new NodeGroup();
		
		PropertyItem prop = new PropertyItem("testProperty", "int", "foo", "http://knowledge.ge.com/bar#foo");
		
		prop.setSparqlID("?foo");
		prop.addInstanceValue("2");
		prop.addInstanceValue("123543");
		
		PropertyItem prop2 = new PropertyItem("anotherTest", "string", "foostr", "http://knowledge.ge.com/bar#foostr");
		
		prop2.setSparqlID("?foostr");
		prop2.addInstanceValue("testvalue");
		prop2.addInstanceValue("anothertest");
		
		ArrayList<PropertyItem> props = new ArrayList<PropertyItem>();
		props.add(prop);
		props.add(prop2);
		
		Node node = new Node("testNode", props, null, "http://knowledge.ge.com/bar", ng);
		ng.addOneNode(node, null, null, null);
		
		// create second node group
		
		NodeGroup ng1 = new NodeGroup();
		
		PropertyItem prop1 = new PropertyItem("testProperty", "int", "foo", "http://knowledge.ge.com/bar#foo");
		
		prop1.setSparqlID("?foo1");
		prop1.addInstanceValue("20");
		prop1.addInstanceValue("1235430");
		
		PropertyItem prop21 = new PropertyItem("anotherTest", "string", "foostr", "http://knowledge.ge.com/bar#foostr");
		
		prop21.setSparqlID("?foostr");
		prop21.addInstanceValue("testvalue");
		prop21.addInstanceValue("anothertest");
		
		ArrayList<PropertyItem> props1 = new ArrayList<PropertyItem>();
		props1.add(prop1);
		props1.add(prop21);
		
		Node node1 = new Node("testNode", props1, null, "http://knowledge.ge.com/bar", ng1);
		
		ng1.addOneNode(node1, null, null, null);
		
		String head = "";
		String body = "";
		
		OntologyInfo oInfo = new OntologyInfo();
		ng.buildPrefixHash();
		ng1.buildPrefixHash();
		
		head += ng.getInsertLeader("0", oInfo);
		body += ng.getInsertWhereBody("0", oInfo);
		
		head += ng1.getInsertLeader("1", oInfo);
		body += ng1.getInsertWhereBody("1", oInfo);
		
		String sparql = ng.generateSparqlPrefix() + ng1.generateSparqlPrefix() + " INSERT {" + head + "} WHERE {" + body + "}";
		
		String expected = "prefix generateSparqlInsert:<belmont/generateSparqlInsert#> prefix XMLSchema:<http://www.w3.org/2001/XMLSchema#> prefix bar:<http://knowledge.ge.com/bar#> prefix generateSparqlInsert:<belmont/generateSparqlInsert#> prefix XMLSchema:<http://www.w3.org/2001/XMLSchema#> prefix bar:<http://knowledge.ge.com/bar#> INSERT {       ?testNode0 a http://knowledge.ge.com/bar . ?testNode0 bar:foo \"2\"^^XMLSchema:int . ?testNode0 bar:foo \"123543\"^^XMLSchema:int . ?testNode0 bar:foostr \"testvalue\"^^XMLSchema:string . ?testNode0 bar:foostr \"anothertest\"^^XMLSchema:string . ?testNode1 a http://knowledge.ge.com/bar . ?testNode1 bar:foo \"20\"^^XMLSchema:int . ?testNode1 bar:foo \"1235430\"^^XMLSchema:int . ?testNode1 bar:foostr \"testvalue\"^^XMLSchema:string . ?testNode1 bar:foostr \"anothertest\"^^XMLSchema:string . } WHERE {       BIND (iri(concat(\"generateSparqlInsert:\"";  // what follows are unique strings
		assertTrue(sparql.replaceAll("\\s+","").startsWith(expected.replaceAll("\\s+",""))); // ignore whitespace

	}
}
