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


package com.ge.research.semtk.services.ingestion;

import java.io.IOException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ge.research.semtk.services.ingestion.IngestionFromStringsRequestBody;
import com.ge.research.semtk.services.ingestion.IngestionProperties;
import com.ge.research.semtk.sparqlX.SparqlConnection;
import com.ge.research.semtk.utility.LocalLogger;
import com.ge.research.semtk.load.DataLoader;
import com.ge.research.semtk.load.dataset.CSVDataset;
import com.ge.research.semtk.load.dataset.Dataset;
import com.ge.research.semtk.load.dataset.ODBCDataset;
import com.ge.research.semtk.load.utility.SparqlGraphJson;
import com.ge.research.semtk.logging.DetailsTuple;
import com.ge.research.semtk.logging.easyLogger.LoggerRestClient;
import com.ge.research.semtk.logging.easyLogger.LoggerClientConfig;
import com.ge.research.semtk.query.rdb.OracleConnector;
import com.ge.research.semtk.query.rdb.PostgresConnector;
import com.ge.research.semtk.resultSet.RecordProcessResults;
import com.ge.research.semtk.resultSet.TableResultSet;

/**
 * Service to load data into a triple store.
 */
@RestController
@RequestMapping("/ingestion")
public class IngestionRestController {
 
	@Autowired
	IngestionProperties prop;
			
	/**
	 * Load data from CSV
	 */
	@CrossOrigin
	@RequestMapping(value="/fromCsvFile", method= RequestMethod.POST)
	public JSONObject fromCsvFile(@RequestParam("template") MultipartFile templateFile, @RequestParam("data") MultipartFile dataFile ){
		return this.fromAnyCsv(templateFile, dataFile, null, true, false);
	}
	@CrossOrigin
	@RequestMapping(value="/fromCsvFileWithNewConnection", method= RequestMethod.POST)
	public JSONObject fromCsvFile(@RequestParam("template") MultipartFile templateFile, @RequestParam("data") MultipartFile dataFile , @RequestParam("connectionOverride") MultipartFile connection){
		return this.fromAnyCsv(templateFile, dataFile, connection, true, false);
	}
	
	@CrossOrigin
	@RequestMapping(value="/fromCsvFilePrecheck", method= RequestMethod.POST)
	public JSONObject fromCsvFilePrecheck(@RequestParam("template") MultipartFile templateFile, @RequestParam("data") MultipartFile dataFile ){
		return this.fromAnyCsv(templateFile, dataFile, null, true, true);
	}
	
	@CrossOrigin
	@RequestMapping(value="/fromCsvFileWithNewConnectionPrecheck", method= RequestMethod.POST)
	public JSONObject fromCsvFilePrecheck(@RequestParam("template") MultipartFile templateFile, @RequestParam("data") MultipartFile dataFile,@RequestParam("connectionOverride") MultipartFile connection){
		return this.fromAnyCsv(templateFile, dataFile, connection, true, true);
	}
	
	/**
	 * Load data from CSV
	 * @throws IOException 
	 * @throws JsonMappingException 
	 * @throws JsonParseException 
	 */
	@CrossOrigin
	@RequestMapping(value="/fromCsv", method= RequestMethod.POST)
	public JSONObject fromCsv(@RequestBody String requestBody) throws JsonParseException, JsonMappingException, IOException{
		// LocalLogger.logToStdErr("the request: " + requestBody);
		IngestionFromStringsRequestBody deserialized = (new ObjectMapper()).readValue(requestBody, IngestionFromStringsRequestBody.class);
		return this.fromAnyCsv(deserialized.getTemplate(), deserialized.getData(), null, false, false);
	}
	
	@CrossOrigin
	@RequestMapping(value="/fromCsvWithNewConnection", method= RequestMethod.POST)
	public JSONObject fromCsvWithNewConnection(@RequestBody String requestBody) throws JsonParseException, JsonMappingException, IOException{
		// LocalLogger.logToStdErr("the request: " + requestBody);
		IngestionFromStringsWithNewConnectionRequestBody deserialized = (new ObjectMapper()).readValue(requestBody, IngestionFromStringsWithNewConnectionRequestBody.class);
		return this.fromAnyCsv(deserialized.getTemplate(), deserialized.getData(), deserialized.getConnectionOverride(), false, false);
	}
	
	@CrossOrigin
	@RequestMapping(value="/fromCsvPrecheck", method= RequestMethod.POST)
	public JSONObject fromCsvPrecheck(@RequestBody IngestionFromStringsRequestBody requestBody){
		return this.fromAnyCsv(requestBody.getTemplate(), requestBody.getData(), null, false, true);
	}

	@CrossOrigin
	@RequestMapping(value="/fromCsvWithNewConnectionPrecheck", method= RequestMethod.POST)
	public JSONObject fromCsvPrecheck(@RequestBody IngestionFromStringsWithNewConnectionRequestBody requestBody){
		return this.fromAnyCsv(requestBody.getTemplate(), requestBody.getData(), requestBody.getConnectionOverride(), false, true);
	}
	
	/**
	 * Load data from csv.
	 * @param templateFile the json template (File if fromFiles=true, else String)
	 * @param dataFile the data file (File if fromFiles=true, else String)
	 * @param sparqlConnectionOverride SPARQL connection json (File if fromFiles=true, else String)  If non-null, will override the connection in the template.
	 * @param fromFiles true to indicate that the 3 above parameters are Files, else Strings
	 * @param safeLoad
	 */
	private JSONObject fromAnyCsv(Object templateFile, Object dataFile, Object sparqlConnectionOverride, Boolean fromFiles, Boolean safeLoad){
		DateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");

		int recordsProcessed = 0;
		
		LoggerRestClient logger = null;	// we may want to log.
		LoggerClientConfig lcc = null;
		ArrayList<DetailsTuple> deets = null;	// details to be logged
		
		logger = loggerConfigInitialization(logger, lcc);	// set up the logger. 
		
		RecordProcessResults retval = new RecordProcessResults();
		
		try {
			if(logger != null){	// always checking if we are actually logging. 
				deets = LoggerRestClient.addDetails("Ingestion Type", "From CSV", null);
			}
			
			// get ingestion sparql credentials
			String sparqlEndpointUser = prop.getSparqlUserName();
			String sparqlEndpointPassword = prop.getSparqlPassword();
			
			// get template file content and convert to json object for use. 
			
			String templateContent = null;
			
			if(fromFiles) { templateContent = new String( ((MultipartFile)templateFile).getBytes() ); }
			else{ templateContent = (String)templateFile ; }
			JSONParser parser = new JSONParser();
			JSONObject json = null;
			
			if(templateContent != null){
				LocalLogger.logToStdErr("template size: "  + templateContent.length());
			}
			else{
				LocalLogger.logToStdErr("template content was null");
			}
			
			json = (JSONObject) parser.parse(templateContent);
			SparqlGraphJson sgJson = new SparqlGraphJson(json);
			
		
			String dataFileContent = null;
			if(fromFiles) { dataFileContent = new String( ((MultipartFile)dataFile).getBytes() ); }
			else{ 
				dataFileContent = (String)dataFile ; 
			}
			
			if(dataFileContent != null){
				LocalLogger.logToStdErr("data size: "  + dataFileContent.length());
			}
			else{
				LocalLogger.logToStdErr("data content was null");
			}
					
			// get the connection override, if any
			if(sparqlConnectionOverride != null){
				String sparqlConnectionString = null;	
				if(fromFiles){
					sparqlConnectionString = new String( ((MultipartFile)sparqlConnectionOverride).getBytes() ); // read from file
				}else{
					sparqlConnectionString = (String)sparqlConnectionOverride;
				}
				// override the connection
				sgJson.setSparqlConn( new SparqlConnection(sparqlConnectionString));				
			}
			
			
			if(logger != null){ // always checking if we are actually logging. 
				deets = LoggerRestClient.addDetails("template", templateContent, deets);
			}
					
			// get a CSV data set to use in the load. 
			Dataset ds = new CSVDataset(dataFileContent, true);

			// perform actual load
			Calendar cal = Calendar.getInstance();
			String startTime = dateFormat.format(cal.getTime());
			if(logger != null) { 
				deets = LoggerRestClient.addDetails("Start Time", startTime, deets); 				
			}
						
			DataLoader dl = new DataLoader(sgJson, prop.getBatchSize(), ds, sparqlEndpointUser, sparqlEndpointPassword);
			
			recordsProcessed = dl.importData(safeLoad); 	// defaulting to preflight.
	
			String endTime = dateFormat.format(cal.getTime());
			if(logger != null) { 
				deets = LoggerRestClient.addDetails("End Time", endTime, deets); 
				deets = LoggerRestClient.addDetails("input record size", recordsProcessed + "", deets);	
			}
			
			// set success values
			if(safeLoad && dl.getLoadingErrorReport().getRows().size() == 0){
				retval.setSuccess(true);
			}
			else if(safeLoad && dl.getLoadingErrorReport().getRows().size() != 0){
				retval.setSuccess(false);
			}
			else if(!safeLoad && recordsProcessed > 0){
				retval.setSuccess(true);
			}
			else {
				retval.setSuccess(false);
			}			
			
			retval.setRecordsProcessed(recordsProcessed);
			retval.setFailuresEncountered(dl.getLoadingErrorReport().getRows().size());
			retval.addResults(dl.getLoadingErrorReport());
		} catch (Exception e) {
			// TODO write failure JSONObject to return and return it.
			LocalLogger.printStackTrace(e);
			
			retval.setSuccess(false);
			retval.addRationaleMessage("ingestion", "fromCsv*", e);
		}
		if(logger != null){ // always checking if we are actually logging. 
			// what are we returning
			deets = LoggerRestClient.addDetails("error code", retval.getResultCodeString(), deets);
			deets = LoggerRestClient.addDetails("results", retval.toJson().toJSONString(), deets);
			deets = LoggerRestClient.addDetails("records Processed", recordsProcessed + "", deets);
		}
		
		if(logger != null){ //log this...
			logger.logEvent("Data ingestion", deets, "Add Instance Data To Triple Store");
		}
		JSONObject retvalJSON = retval.toJson();
	//	LocalLogger.logToStdErr(retvalJSON.toJSONString());
		return retvalJSON;
	}
			

	@CrossOrigin
	@RequestMapping(value="/fromOracleODBC", method= RequestMethod.POST)
	public JSONObject fromOracleODBC(@RequestParam("template") MultipartFile templateFile, @RequestParam("dbHost") String dbHost, @RequestParam("dbPort") String dbPort, @RequestParam("dbDatabase") String dbDatabase, @RequestParam("dbUser") String dbUser, @RequestParam("dbPassword") String dbPassword, @RequestParam("dbQuery") String dbQuery){
		
		TableResultSet retval = new TableResultSet();
		int recordsProcessed = 0;

		
		try {
					
			String sparqlEndpointUser = prop.getSparqlUserName();
			String sparqlEndpointPassword = prop.getSparqlPassword();
			
			// log the attempted credentials
			LocalLogger.logToStdErr("the user name was: " + sparqlEndpointUser);
			
			// get template file content and convert to json object for use. 
			String templateContent = new String(templateFile.getBytes());
			JSONParser parser = new JSONParser();
			JSONObject json = null;
			json = (JSONObject) parser.parse(templateContent);
		
			// get an ODBC data set to use in the load. 
			String oracleDriver = OracleConnector.getDriver();
			String dbUrl = OracleConnector.getDatabaseURL(dbHost, Integer.valueOf(dbPort), dbDatabase);
			Dataset ds = new ODBCDataset(oracleDriver, dbUrl, dbUser, dbPassword, dbQuery);
			
			// perform actual load
			DataLoader dl = new DataLoader(new SparqlGraphJson(json), prop.getBatchSize(), ds, sparqlEndpointUser, sparqlEndpointPassword);
			recordsProcessed = dl.importData(true);	// defaulting to preflight.
	
			retval.setSuccess(true);
			retval.addResultsJSON(dl.getLoadingErrorReport().toJson());

		} catch (Exception e) {
			// TODO write failure JSONObject to return and return it.
			LocalLogger.printStackTrace(e);
			
			retval.setSuccess(false);
			retval.addRationaleMessage("ingestion", "fromOracleODBC", e);
		}
		
		return retval.toJson();
	}		
	
	
	@RequestMapping(value="/fromPostgresODBC", method= RequestMethod.POST)
	public JSONObject fromPostgresODBC(@RequestParam("template") MultipartFile templateFile, @RequestParam("dbHost") String dbHost, @RequestParam("dbPort") String dbPort, @RequestParam("dbDatabase") String dbDatabase, @RequestParam("dbUser") String dbUser, @RequestParam("dbPassword") String dbPassword, @RequestParam("dbQuery") String dbQuery){
		
		TableResultSet retval = new TableResultSet();
		int recordsProcessed = 0;

		
		try {
					
			String sparqlEndpointUser = prop.getSparqlUserName();
			String sparqlEndpointPassword = prop.getSparqlPassword();
			
			// log the attempted user name and password
			LocalLogger.logToStdErr("the user name was: " + sparqlEndpointUser);
			LocalLogger.logToStdErr("the password was: " + sparqlEndpointPassword);
			
			// get template file content and convert to json object for use. 
			String templateContent = new String(templateFile.getBytes());
			JSONParser parser = new JSONParser();
			JSONObject json = null;
			json = (JSONObject) parser.parse(templateContent);
		
			// get an ODBC data set to use in the load. 
			String postgresDriver = PostgresConnector.getDriver();
			String dbUrl = PostgresConnector.getDatabaseURL(dbHost, Integer.valueOf(dbPort), dbDatabase);
			Dataset ds = new ODBCDataset(postgresDriver, dbUrl, dbUser, dbPassword, dbQuery);
			
			// perform actual load
			DataLoader dl = new DataLoader(new SparqlGraphJson(json), prop.getBatchSize(), ds, sparqlEndpointUser, sparqlEndpointPassword);
			recordsProcessed = dl.importData(true);	// defaulting to preflight.
	
			retval.setSuccess(true);
			retval.addResultsJSON(dl.getLoadingErrorReport().toJson());

		} catch (Exception e) {
			// TODO write failure JSONObject to return and return it.
			LocalLogger.printStackTrace(e);
			
			retval.setSuccess(false);
			retval.addRationaleMessage("ingestion", "fromPostgresODBC", e);

		}
		
		return retval.toJson();
	}	
	
	private LoggerRestClient loggerConfigInitialization(LoggerRestClient logger, LoggerClientConfig lcc){
		// send a log of the load having occurred.
		try{	// wrapped in a try block because logging never announces a failure.
			if(prop.getLoggingEnabled()){
				// logging was set to occur. 
				lcc = new LoggerClientConfig(prop.getApplicationLogName(), prop.getLoggingProtocol(), prop.getLoggingServer(), Integer.parseInt(prop.getLoggingPort()), prop.getLoggingServiceLocation());
				logger = new LoggerRestClient(lcc);
			}
		}
		catch(Exception eee){
			// do nothing. 
			LocalLogger.logToStdErr("logging failed. No other details available.");
			LocalLogger.printStackTrace(eee);
		}
		return logger;
	}
}
