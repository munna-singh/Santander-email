# Santander email Campaign

### Technology stack
- Node
- MJML
- EJS

### Steps for developer
- Download the file from git hub (https://github.com/Gale43/Santander-email) on local machine
- Using text editor like VS Code, navigate to downloaded folder
- Run "npm install"
- Above command download and install all required node modules.
- Run "node index.js" to run the website on http://localhost:3000/


### Assigning value to a field/text in template
Email template pulls the data from googleSheet which is currently located at https://docs.google.com/spreadsheets/d/1Y-lwy6mJlnMgRzEdqX1xDa_9d2wNe9DxLET7Ow9AHLU . Each row in the sheet represent a template for the mail. The demo of the email template can be seen from http://localhost:3000 and selecting the respective row in the grid.

To assign the value in EJS template, use data.column_name. Column name is the second column name in google sheet. Please note, the column name should always be written in lower case inside the template. 

For example, if column name in google sheet is "Hero_Image", the template should have value like "<%= data.hero_image %>". Object "data" is the master object which holds all values of excelsheet.

### Running the docker app
 - Go to the directory that has your Dockerfile
 - Create docker image with name 'santander-email' `docker build -t santander-email .`
 - Run docker image `docker run -p 3000:3000 santander-email`
