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


package com.ge.research.semtk.edc.client.test;

import static org.junit.Assert.*;

import java.io.FileNotFoundException;
import java.net.URL;
import java.util.ArrayList;

import org.apache.commons.io.IOUtils;
import org.json.simple.JSONObject;
import org.junit.BeforeClass;
import org.junit.Test;

import com.ge.research.semtk.edc.client.ResultsClient;
import com.ge.research.semtk.edc.client.ResultsClientConfig;
import com.ge.research.semtk.resultSet.Table;
import com.ge.research.semtk.test.IntegrationTestUtility;
import com.ge.research.semtk.utility.Utility;

public class ResultsClientTest_IT {
	
	private static String SERVICE_PROTOCOL;
	private static String SERVICE_SERVER;
	private static int SERVICE_PORT;
	
	private final String CSV_CONTENTS = "one,two,three\n1,2,3\n10,20,30\n100,200,300\n";
	private final String EXTENSION = "csv";
	private final String JOB_ID = "results_test_jobid";
	
	private static ResultsClient client = null;
	
	@BeforeClass
	public static void setup() throws Exception{
		SERVICE_PROTOCOL = IntegrationTestUtility.getServiceProtocol();
		SERVICE_SERVER = IntegrationTestUtility.getResultsServiceServer();
		SERVICE_PORT = IntegrationTestUtility.getResultsServicePort();
		client = new ResultsClient(new ResultsClientConfig(SERVICE_PROTOCOL, SERVICE_SERVER, SERVICE_PORT));
	}
	
	@Test
	public void testSingleFile() throws Exception {

		try {	
			client.execStoreSingleFileResults(JOB_ID, CSV_CONTENTS, EXTENSION);
			URL[] urls = client.execGetResults(JOB_ID);
			
			assertTrue(urls[0] == null); 
			String contents = IOUtils.toString(urls[1]);
			assertTrue(contents.equals(CSV_CONTENTS));
			assertTrue(urls[1].toString().endsWith(EXTENSION));
			
		} finally {
			cleanup(client, JOB_ID);
		}
	}
	
	@Test
	public void testTable() throws Exception {

		String [] cols = {"col1", "col2"};
		String [] types = {"String", "String"};
		ArrayList<String> row = new ArrayList<String>();
		row.add("one");
		row.add("two");
		
		try {
			Table table = new Table(cols, types, null);
			table.addRow(row);
			table.addRow(row);
			
			client.execStoreTableResults(JOB_ID, table);
			URL[] urls = client.execGetResults(JOB_ID);
			
			assertTrue(urls[0].toString().endsWith("_sample.json")); 
			assertTrue(urls[1].toString().endsWith(".csv")); 

			// check the results.
			String resultString = Utility.getURLContentsAsString(urls[1]);
			String expectedResultString = "col1,col2\none, two\none, two\n";
			assertEquals(expectedResultString, resultString);
		} finally {
			cleanup(client, JOB_ID);
		}
	}
	
	@Test
	public void testBiggerTable() throws Exception {

		try {
			long startTime = System.nanoTime();
			
			JSONObject jsonObj = Utility.getJSONObjectFromFilePath("src/test/resources/table9000.json");
			Table table = Table.fromJson(jsonObj);
			
			long endTime = System.nanoTime();
			double elapsed = ((endTime - startTime) / 1000000000.0);
			System.err.println(String.format(">>> Utility.getJSONEObjectFromFilePath()=%.2f sec", elapsed));

			// --- store results ----
			startTime = System.nanoTime();		
			client.execStoreTableResults(JOB_ID, table);
			endTime = System.nanoTime();
			elapsed = ((endTime - startTime) / 1000000000.0);
			System.err.println(String.format(">>> client.execStoreTableResults()=%.2f sec", elapsed));
			
			// --- test results ---
			URL[] urls = client.execGetResults(JOB_ID);
			
			assertTrue(urls[0].toString().endsWith(".json")); 
			assertTrue(urls[1].toString().endsWith(".csv")); 

			// trust ResultsStorageTest.java to test the contents
		} finally {
			cleanup(client, JOB_ID);
		}
	}
	
	@Test
	public void testStoreCsv() throws Exception {

		try {	
			client.execStoreCsvResults(JOB_ID, CSV_CONTENTS);
			URL[] urls = client.execGetResults(JOB_ID);
			
			String sample = IOUtils.toString(urls[0]);
			assertTrue(sample.equals(CSV_CONTENTS)); 
		
			String contents = IOUtils.toString(urls[1]);
			assertTrue(contents.equals(CSV_CONTENTS));
		
		} finally {
			cleanup(client, JOB_ID);
		}
	}
	
	@Test
	public void test_delete() throws Exception {
		try {
			client.execStoreCsvResults(JOB_ID, CSV_CONTENTS);
			client.execDeleteStorage(JOB_ID);
			URL[] urls = client.execGetResults(JOB_ID);

			String sample = IOUtils.toString(urls[0]);
			assertTrue(sample == null);
			
		} catch (FileNotFoundException e) {
			// success			
		} finally {
			cleanup(client, JOB_ID);
		}
	}
	
	private void cleanup(ResultsClient client, String jobId) throws Exception {
		client.execDeleteStorage(JOB_ID);
	}

}
