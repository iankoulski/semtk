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

package com.ge.research.semtk.api.nodeGroupExecution.utility;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import com.ge.research.semtk.api.nodeGroupExecution.client.NodeGroupExecutionClient;
import com.ge.research.semtk.api.nodeGroupExecution.client.NodeGroupExecutionClientConfig;
import com.ge.research.semtk.api.storedQueryExecution.utility.insert.ColumnToRequestMapping;
import com.ge.research.semtk.api.storedQueryExecution.utility.insert.GenericInsertionRequestBody;
import com.ge.research.semtk.belmont.NodeGroup;
import com.ge.research.semtk.resultSet.RecordProcessResults;
import com.ge.research.semtk.resultSet.Table;
import com.ge.research.semtk.resultSet.TableResultSet;
import com.ge.research.semtk.utility.LocalLogger;

public class StoredNodeGroupExecutionLauncher {
	
	
	public StoredNodeGroupExecutionLauncher(){
		
	}
	// by ID
	// select functionality
	public TableResultSet launchSelectJob(String id, JSONArray runtimeConstraintsJson, JSONObject edcConstraints, JSONObject sparqlConnectionAsJsonObject, NodeGroupExecutionClientConfig sncc) throws Exception{
		TableResultSet retval = null;
		
		// create the executor we will be using
		NodeGroupExecutionClient snec 		= new NodeGroupExecutionClient(sncc);
		
		
		// get a name for the job.
		LocalLogger.logToStdErr("About to request job");
		String jobId = snec.executeDispatchSelectByIdWithSimpleReturn(id, sparqlConnectionAsJsonObject, edcConstraints, runtimeConstraintsJson);
		LocalLogger.logToStdErr("job request created. Job ID returned was " + jobId);
		
		// waiting on results.
		LocalLogger.logToStdErr("About to wait for completion");
		while(snec.executeGetJobCompletionCheckWithSimpleReturn(jobId) == false){
			Thread.sleep(100);
		}
		LocalLogger.logToStdErr("requested Job completed");
		
		// finished now. check the result.
		String status = snec.executeGetJobStatusWithSimpleReturn(jobId);
		
		if(status.equalsIgnoreCase("success") ){
			LocalLogger.logToStdErr("requested job succeeded");
			// get results.
			Table retTable = snec.executeGetResultsTable(jobId);
			retval = new TableResultSet(true);
			retval.addResults(retTable); 
		}
		
		else{
			// report failure.
			LocalLogger.logToStdErr("requested job failed");
			retval = new TableResultSet(false);
			retval.addRationaleMessage("StoredNodeGroupExecutionLauncher.launchSelectJob", snec.executeGetJobStatusMessageWithSimpleReturn(jobId));
		}
		
		return retval;
	}	
	
	// Delete functionality
	public TableResultSet launchDeleteJob(String id, JSONArray runtimeConstraintsJson, JSONObject edcConstraints, JSONObject sparqlConnectionAsJsonObject, NodeGroupExecutionClientConfig sncc) throws Exception{
		TableResultSet retval = null;
		
		// create the executor we will be using
		NodeGroupExecutionClient snec 		= new NodeGroupExecutionClient(sncc);
		
		
		// get a name for the job.
		LocalLogger.logToStdErr("About to request job");
		String jobId = snec.executeDispatchDeleteByIdWithSimpleReturn(id, sparqlConnectionAsJsonObject, edcConstraints, runtimeConstraintsJson);
		LocalLogger.logToStdErr("job request created. Job ID returned was " + jobId);
		
		// waiting on results.
		LocalLogger.logToStdErr("About to wait for completion");
		while(snec.executeGetJobCompletionCheckWithSimpleReturn(jobId) == false){
			Thread.sleep(100);
		}
		LocalLogger.logToStdErr("requested Job completed");
		
		// finished now. check the result.
		String status = snec.executeGetJobStatusWithSimpleReturn(jobId);
		
		if(status.equalsIgnoreCase("success") ){
			LocalLogger.logToStdErr("requested job succeeded");
			// get results.
			Table retTable = snec.executeGetResultsTable(jobId);
			retval = new TableResultSet(true);
			retval.addResults(retTable); 
		}
		
		else{
			// report failure.
			LocalLogger.logToStdErr("requested job failed");
			retval = new TableResultSet(false);
			retval.addRationaleMessage("StoredNodeGroupExecutionLauncher.launchDeleteJob", snec.executeGetJobStatusMessageWithSimpleReturn(jobId));
		}
		
		return retval;
	}	

	// Count functionality
	public TableResultSet launchCountJob(String id, JSONArray runtimeConstraintsJson, JSONObject edcConstraints, JSONObject sparqlConnectionAsJsonObject, NodeGroupExecutionClientConfig sncc) throws Exception{
		TableResultSet retval = null;
		
		// create the executor we will be using
		NodeGroupExecutionClient snec 		= new NodeGroupExecutionClient(sncc);
		
		
		// get a name for the job.
		LocalLogger.logToStdErr("About to request job");
		String jobId = snec.executeDispatchCountByIdWithSimpleReturn(id, sparqlConnectionAsJsonObject, edcConstraints, runtimeConstraintsJson);
		LocalLogger.logToStdErr("job request created. Job ID returned was " + jobId);
		
		// waiting on results.
		LocalLogger.logToStdErr("About to wait for completion");
		while(snec.executeGetJobCompletionCheckWithSimpleReturn(jobId) == false){
			Thread.sleep(100);
		}
		LocalLogger.logToStdErr("requested Job completed");
		
		// finished now. check the result.
		String status = snec.executeGetJobStatusWithSimpleReturn(jobId);
		
		if(status.equalsIgnoreCase("success") ){
			LocalLogger.logToStdErr("requested job succeeded");
			// get results.
			Table retTable = snec.executeGetResultsTable(jobId);
			retval = new TableResultSet(true);
			retval.addResults(retTable); 
		}
		
		else{
			// report failure.
			LocalLogger.logToStdErr("requested job failed");
			retval = new TableResultSet(false);
			retval.addRationaleMessage("StoredNodeGroupExecutionLauncher.launchCountJob", snec.executeGetJobStatusMessageWithSimpleReturn(jobId));
		}
		
		return retval;
	}	
	
	// select functionality
	public TableResultSet launchFilterJob(String id, String targetObjectSparqlId, JSONArray runtimeConstraintsJson, JSONObject edcConstraints, JSONObject sparqlConnectionAsJsonObject, NodeGroupExecutionClientConfig sncc) throws Exception{
		TableResultSet retval = null;
		
		// create the executor we will be using
		NodeGroupExecutionClient snec 		= new NodeGroupExecutionClient(sncc);
		
		
		// get a name for the job.
		LocalLogger.logToStdErr("About to request job");
		String jobId = snec.executeDispatchFilterByIdWithSimpleReturn(id, targetObjectSparqlId, sparqlConnectionAsJsonObject, edcConstraints, runtimeConstraintsJson);
		LocalLogger.logToStdErr("job request created. Job ID returned was " + jobId);
		
		// waiting on results.
		LocalLogger.logToStdErr("About to wait for completion");
		while(snec.executeGetJobCompletionCheckWithSimpleReturn(jobId) == false){
			Thread.sleep(100);
		}
		LocalLogger.logToStdErr("requested Job completed");
		
		// finished now. check the result.
		String status = snec.executeGetJobStatusWithSimpleReturn(jobId);
		
		if(status.equalsIgnoreCase("success") ){
			LocalLogger.logToStdErr("requested job succeeded");
			// get results.
			Table retTable = snec.executeGetResultsTable(jobId);
			retval = new TableResultSet(true);
			retval.addResults(retTable); 
		}
		
		else{
			// report failure.
			LocalLogger.logToStdErr("requested job failed");
			retval = new TableResultSet(false);
			retval.addRationaleMessage("StoredNodeGroupExecutionLauncher.launchFilterJob", snec.executeGetJobStatusMessageWithSimpleReturn(jobId));
		}
		
		return retval;
	}	
	
	// by NodeGroup			
	// select functionality
	public TableResultSet launchSelectJob(NodeGroup ng, JSONArray runtimeConstraintsJson, JSONObject edcConstraints, JSONObject sparqlConnectionAsJsonObject, NodeGroupExecutionClientConfig sncc) throws Exception{
		TableResultSet retval = null;
		
		// create the executor we will be using
		NodeGroupExecutionClient snec 		= new NodeGroupExecutionClient(sncc);
		
		
		// get a name for the job.
		LocalLogger.logToStdErr("About to request job");
		String jobId = snec.executeDispatchSelectFromNodeGroupWithSimpleReturn(ng, sparqlConnectionAsJsonObject, edcConstraints, runtimeConstraintsJson);
	
		LocalLogger.logToStdErr("job request created. Job ID returned was " + jobId);
		
		// waiting on results.
		LocalLogger.logToStdErr("About to wait for completion");
		while(snec.executeGetJobCompletionCheckWithSimpleReturn(jobId) == false){
			Thread.sleep(100);
		}
		LocalLogger.logToStdErr("requested Job completed");
		
		// finished now. check the result.
		String status = snec.executeGetJobStatusWithSimpleReturn(jobId);
		
		if(status.equalsIgnoreCase("success") ){
			LocalLogger.logToStdErr("requested job succeeded");
			// get results.
			Table retTable = snec.executeGetResultsTable(jobId);
			retval = new TableResultSet(true);
			retval.addResults(retTable); 
		}
		
		else{
			// report failure.
			LocalLogger.logToStdErr("requested job failed");
			retval = new TableResultSet(false);
			retval.addRationaleMessage("StoredNodeGroupExecutionLauncher.launchSelectJob", snec.executeGetJobStatusMessageWithSimpleReturn(jobId));
		}
		
		return retval;
	}	
		
	// count functionality
	public TableResultSet launchCounctJob(NodeGroup ng, JSONArray runtimeConstraintsJson, JSONObject edcConstraints, JSONObject sparqlConnectionAsJsonObject, NodeGroupExecutionClientConfig sncc) throws Exception{
		TableResultSet retval = null;
		
		// create the executor we will be using
		NodeGroupExecutionClient snec 		= new NodeGroupExecutionClient(sncc);
		
		
		// get a name for the job.
		LocalLogger.logToStdErr("About to request job");
		String jobId = snec.executeDispatchCountFromNodeGroupWithSimpleReturn(ng, sparqlConnectionAsJsonObject, edcConstraints, runtimeConstraintsJson);
	
		LocalLogger.logToStdErr("job request created. Job ID returned was " + jobId);
		
		// waiting on results.
		LocalLogger.logToStdErr("About to wait for completion");
		while(snec.executeGetJobCompletionCheckWithSimpleReturn(jobId) == false){
			Thread.sleep(100);
		}
		LocalLogger.logToStdErr("requested Job completed");
		
		// finished now. check the result.
		String status = snec.executeGetJobStatusWithSimpleReturn(jobId);
		
		if(status.equalsIgnoreCase("success") ){
			LocalLogger.logToStdErr("requested job succeeded");
			// get results.
			Table retTable = snec.executeGetResultsTable(jobId);
			retval = new TableResultSet(true);
			retval.addResults(retTable); 
		}
		
		else{
			// report failure.
			LocalLogger.logToStdErr("requested job failed");
			retval = new TableResultSet(false);
			retval.addRationaleMessage("StoredNodeGroupExecutionLauncher.launchCountJob", snec.executeGetJobStatusMessageWithSimpleReturn(jobId));
		}
		
		return retval;
	}	
		
	// delete functionality
	public TableResultSet launchDeleteJob(NodeGroup ng, JSONArray runtimeConstraintsJson, JSONObject edcConstraints, JSONObject sparqlConnectionAsJsonObject, NodeGroupExecutionClientConfig sncc) throws Exception{
		TableResultSet retval = null;
		
		// create the executor we will be using
		NodeGroupExecutionClient snec 		= new NodeGroupExecutionClient(sncc);
		
		
		// get a name for the job.
		LocalLogger.logToStdErr("About to request job");
		String jobId = snec.executeDispatchDeleteFromNodeGroupWithSimpleReturn(ng, sparqlConnectionAsJsonObject, edcConstraints, runtimeConstraintsJson);
	
		LocalLogger.logToStdErr("job request created. Job ID returned was " + jobId);
		
		// waiting on results.
		LocalLogger.logToStdErr("About to wait for completion");
		while(snec.executeGetJobCompletionCheckWithSimpleReturn(jobId) == false){
			Thread.sleep(100);
		}
		LocalLogger.logToStdErr("requested Job completed");
		
		// finished now. check the result.
		String status = snec.executeGetJobStatusWithSimpleReturn(jobId);
		
		if(status.equalsIgnoreCase("success") ){
			LocalLogger.logToStdErr("requested job succeeded");
			// get results.
			Table retTable = snec.executeGetResultsTable(jobId);
			retval = new TableResultSet(true);
			retval.addResults(retTable); 
		}
		
		else{
			// report failure.
			LocalLogger.logToStdErr("requested job failed");
			retval = new TableResultSet(false);
			retval.addRationaleMessage("StoredNodeGroupExecutionLauncher.launchDeleteJob", snec.executeGetJobStatusMessageWithSimpleReturn(jobId));
		}
		
		return retval;
	}	

	// Filter functionality
	public TableResultSet launchFilterJob(NodeGroup ng, String targetObjectSparqlId, JSONArray runtimeConstraintsJson, JSONObject edcConstraints, JSONObject sparqlConnectionAsJsonObject, NodeGroupExecutionClientConfig sncc) throws Exception{
		TableResultSet retval = null;
		
		// create the executor we will be using
		NodeGroupExecutionClient snec 		= new NodeGroupExecutionClient(sncc);
		
		
		// get a name for the job.
		LocalLogger.logToStdErr("About to request job");
		String jobId = snec.executeDispatchFilterFromNodeGroupWithSimpleReturn(ng, targetObjectSparqlId, sparqlConnectionAsJsonObject, edcConstraints, runtimeConstraintsJson);
	
		LocalLogger.logToStdErr("job request created. Job ID returned was " + jobId);
		
		// waiting on results.
		LocalLogger.logToStdErr("About to wait for completion");
		while(snec.executeGetJobCompletionCheckWithSimpleReturn(jobId) == false){
			Thread.sleep(100);
		}
		LocalLogger.logToStdErr("requested Job completed");
		
		// finished now. check the result.
		String status = snec.executeGetJobStatusWithSimpleReturn(jobId);
		
		if(status.equalsIgnoreCase("success") ){
			LocalLogger.logToStdErr("requested job succeeded");
			// get results.
			Table retTable = snec.executeGetResultsTable(jobId);
			retval = new TableResultSet(true);
			retval.addResults(retTable); 
		}
		
		else{
			// report failure.
			LocalLogger.logToStdErr("requested job failed");
			retval = new TableResultSet(false);
			retval.addRationaleMessage("StoredNodeGroupExecutionLauncher.launchFilterJob", snec.executeGetJobStatusMessageWithSimpleReturn(jobId));
		}
		
		return retval;
	}	

	
	// insert functionality
	public RecordProcessResults launchInsertJob(String nodegroupAndTemplateId, String csvContentStr, JSONObject sparqlConnectionAsJsonObject, NodeGroupExecutionClientConfig sncc) throws Exception{
		RecordProcessResults retval = null;
		
		// create the executor we will be using
		NodeGroupExecutionClient snec 		= new NodeGroupExecutionClient(sncc);

		// send the request
		retval = snec.execIngestionFromCsvStr(nodegroupAndTemplateId, csvContentStr, sparqlConnectionAsJsonObject);
		
		// good, bad or other: send the results. 
		return retval;
	}
	
	public RecordProcessResults launchInsertJob(String nodegroupAndTemplateId, JSONArray mappingArray, GenericInsertionRequestBody requestBody, JSONObject sparqlConnectionAsJsonObject, NodeGroupExecutionClientConfig sncc) throws Exception{
		RecordProcessResults retval = null;
		
		ColumnToRequestMapping colMapper = new ColumnToRequestMapping(mappingArray, requestBody);
		String csvData = colMapper.getCsvString();
		
		// send the request using the call which already takes a plain csv
		retval = launchInsertJob(nodegroupAndTemplateId, csvData, sparqlConnectionAsJsonObject, sncc);
			
		return retval;
	}
	
	
}
