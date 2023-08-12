const fs = require('fs');
const readline = require('readline');
const path = require('path');
const parentDir = path.resolve(__dirname);

// Define the input file path
let logFilePath = `${parentDir}/logs_file/api-dev-out.log`;
const httpStatusCodes = {
    // 1xx Informational
    "100": 'Continue',
    "101": 'Switching Protocols',
    "102": 'Processing',
  
    // 2xx Success
    "200": 'OK',
    "201": 'Created',
    "202": 'Accepted',
    "204": 'No Content',
    "206": 'Partial Content',
  
    // 3xx Redirection
    "300": 'Multiple Choices',
    "301": 'Moved Permanently',
    "302": 'Found',
    "304": 'Not Modified',
    "307": 'Temporary Redirect',
    "308": 'Permanent Redirect',
  
    // 4xx Client Errors
    "400": 'Bad Request',
    "401": 'Unauthorized',
    "403": 'Forbidden',
    "404": 'Not Found',
    "405": 'Method Not Allowed',
    "409": 'Conflict',
    "410": 'Gone',
    "429": 'Too Many Requests',
  
    // 5xx Server Errors
    "500": 'Internal Server Error',
    "501": 'Not Implemented',
    "502": 'Bad Gateway',
    "503": 'Service Unavailable',
    "504": 'Gateway Timeout',
    "505": 'HTTP Version Not Supported',
  };



// Create an interface to read from the console
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
let main = async() => {
    try{
        for(let i=0; i<2; i++){
            let question = i == 0 ? 'Enter file name here(api-dev-out.log, api-prod-out.log, prod-api-prod-out.log): ' : 'Please enter index number log need\n1. Which endpoint is called how many times\n2. How many API calls were being made on per minute basis\n3. How many API calls are there in total for each HTTP status code: \n'
            await new Promise((resolve, reject) => {
                rl.question(question, (answer) => {
                    console.log('You entered:', answer);
                    console.log(i)
                    if(i == 0){
                        logFilePath = `${parentDir}/logs_file/${answer}`;
                    }else{
                        if(answer === '1'){
                            table_endpoint_count()
                        }else if(answer === '2'){
                            table_timestammp()
                        }else if(answer === '3'){
                            table_status_codes()
                        }else{
                            console.log("Invalid input please enter numbers")
                        }

                        rl.close(); // Close the readline interface
                    }
                    resolve(true)
                });
            })
        }
        
            
        // rl.question(question, (answer) => {
        //     console.log('You entered:', answer);
        //     if(answer === '1'){
        //         table_endpoint_count()
        //     }else if(answer === '2'){
        //         table_timestammp()
        //     }else if(answer === '3'){
        //         table_status_codes()
        //     }else{
        //         console.log("Invalid input please enter numbers")
        //     }
        // rl.close(); // Close the readline interface
        // });
    }catch(e){
        console.log("Error in ", e)
    }
}
main()





const table_timestammp = () => {
    function countApiCalls(logData) {
        const logLines = logData.split('\n');
        const timestampCounts = {};
      
        logLines.forEach((line) => {
          const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2} \+\d{2}:\d{2}):/);
          if (match) {
            const timestamp = match[1];
            timestampCounts[timestamp] = (timestampCounts[timestamp] || 0) + 1;
          }
        });
      
        return timestampCounts;
      }
      fs.readFile(logFilePath, 'utf8', (err, logData) => {
        if (err) {
          console.error('Error reading the log file:', err);
          return;
        }
      
        const timestampCounts = countApiCalls(logData);
        const tableData = [];
        for (const timestamp in timestampCounts) {
          tableData.push({ 'timestamp': timestamp, 'count': timestampCounts[timestamp] });
        }
        console.table(tableData);
      });
}

const table_endpoint_count = () => {
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading log file:', err);
          return;
        }
      
        const logEntries = data.split('\n').filter(entry => entry.trim() !== '');
      
        const apiEndpointCounts = {};
      
        logEntries.forEach(entry => {
          const match = entry.match(/"([A-Z]+)\s+([^"]+)"/);
          if (match && match[1] && match[2]) {
            const method = match[1];
            const endpoint = match[2];
            const key = `${method} ${endpoint}`;
            apiEndpointCounts[key] = (apiEndpointCounts[key] || 0) + 1;
          }
        });
      
        // Convert the API Endpoint Counts into an array of objects
        const apiEndpointCountsArray = Object.entries(apiEndpointCounts).map(([endpoint, count]) => ({ endpoint, count }));
      
        // Display the results as a table
        console.table(apiEndpointCountsArray, ['endpoint', 'count']);
      });
}

const table_status_codes = () => {
    const apiCallsByStatusCode = {};

    const fileStream = fs.createReadStream(logFilePath);
    const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
    const match = line.match(/\s(\d{3})\s/); // Match HTTP status code
    if (match) {
        const statusCode = match[1];
        if(httpStatusCodes[statusCode]){
            apiCallsByStatusCode[statusCode] = (apiCallsByStatusCode[statusCode] || 0) + 1;
        }
    }
    });

    rl.on('close', () => {
    // Prepare the results in the required format for console.table
    const tableData = Object.keys(apiCallsByStatusCode).map(statusCode => {
        return {
        'Status Code': statusCode,
        'Count': apiCallsByStatusCode[statusCode]
        };
    });

    // Display the results using console.table
    console.table(tableData);
    });
}
