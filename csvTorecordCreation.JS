import { LightningElement,track,wire } from 'lwc';
import hasDataLoaderCustomPermission from '@salesforce/customPermission/Custom_Data_Loader_Permissions';
import hasAccCreationCustomPermission from '@salesforce/customPermission/AccountCreationCP';
import hasConCreationCustomPermission from '@salesforce/customPermission/ContactCreationCP';
import hasOppCreationCustomPermission from '@salesforce/customPermission/OpportunityCreationCP';


import getHeaders from "@salesforce/apex/CSVParser.getHeaders";
import saveCsvFile1 from "@salesforce/apex/CSVParser.saveCsvFile1";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class CsvToRecordCreation extends LightningElement {
    @track items = []; //this will hold key, value pair
    @track value = ''; //initialize combo box value
    @track chosenValue = '';
    error ='';
    showAccountFileUpload=false;
    showContactFileUpload=false;
    showOpportunityFileUpload=false;
    acceptedFormats = ['.csv'];
    headerData=[];
    userHasDataLoaderPermission = false;
    userHasAccCreationPermission = false;
    userHasConCreationPermission = false;
    userHasOppCreationPermission = false;
    @track isButtonDisabled = false;
    @track fileName = '';
    @track fileContent = '';
   checkSubmit=true;
    columns =[];
    data = [];
    showPreview=false;
    showCancelButton=true;
    showPreviewButton=true;
    showModal=false;
    apexParams = { fileName:'',fileBody:'',headerId:''};
           
    connectedCallback() {
        this.userHasDataLoaderPermission = hasDataLoaderCustomPermission;
        this.userHasAccCreationPermission = hasAccCreationCustomPermission;
        this.userHasConCreationPermission = hasConCreationCustomPermission;
        this.userHasOppCreationPermission = hasOppCreationCustomPermission;
    }
   
   
    @wire(getHeaders)
    wiredRecords({ error, data }) {
    if (data) {
         console.log(data);
         this.headerData=data;
         console.log(this.headerData);
        for(let i=0; i<data.length; i++)  {
            this.items = [...this.items ,{value: data[i].Id , label: data[i].Name} ];                                  
        }            
        this.error = undefined;
    } else if (error) {
        this.error = error;
       
    }
}


get recordOptions() {
    return this.items;
}
getValueByRecordId(recordId) {
    let record = this.headerData.find(r =>r.Id === recordId);
    console.log(record);
    return record ? record.Name : null;
}
    handleChange(event) {
    // Get the string of the "value" attribute on the selected option
    console.log(event.detail);
    const selectedOption = event.detail.value;
    console.log('selected value=' + selectedOption);
    this.chosenValue = selectedOption;
    let value= this.getValueByRecordId(selectedOption);
    console.log(value);
    console.log(value=='Account');
    if(value=="Account"){
    this.showAccountFileUpload=true;
    this.showContactFileUpload=false;
    this.showOpportunityFileUpload=false;
    }else if(value=="Contact"){
    this.showAccountFileUpload=false;
    this.showContactFileUpload=true;
    this.showOpportunityFileUpload=false;
    }else if(value=="Opportunity"){
    this.showAccountFileUpload=false;
    this.showContactFileUpload=false;
    this.showOpportunityFileUpload=true;
    }else{
    this.showAccountFileUpload=false;
    this.showContactFileUpload=false;
    this.showOpportunityFileUpload=false;
    }


    }
     




//this value will be shown as selected value of combobox item
get selectedValue(){
    return this.chosenValue;
}


handleAccUploadFile(event) {
    this.apexParams = { fileName:'',fileBody:'',headerId:''};
    if (event.detail.files && event.detail.files.length) {
        const csvFile = event.detail.files[0];
        console.log(csvFile.name);
        let filename = csvFile.name;
        let nameWithoutExtension = filename.slice(0, filename.lastIndexOf("."));
        console.log(nameWithoutExtension);
        if(nameWithoutExtension != 'AccountCreationCP'){
            alert('CSV File Name Should be AccountCreationCP');
            return;
        }
        this.showSpinner = true;
        const fileReader = new FileReader();
        fileReader.onloadend = () => {
            const fileBody = fileReader.result;
            console.log(fileBody);
            this.apexParams = {
                fileName: csvFile.name,
                fileBody,
                headerId:this.chosenValue
            };
            //saveCsvFile(apexParams);
            this.parseCsv(fileBody);
            this.showSpinner = false;
            this.isButtonDisabled = true;
            this.fileName =  csvFile.name;  
            this.fileContent = fileBody;
            
            
        };
        fileReader.readAsText(csvFile);
    }
   
}
       
handleConUploadFile(event) {
    console.log(event.detail.files);
    if (event.detail.files && event.detail.files.length) {
        const csvFile = event.detail.files[0];
        console.log(csvFile.name);
        let filename = csvFile.name;
        let nameWithoutExtension = filename.slice(0, filename.lastIndexOf("."));
        console.log(nameWithoutExtension);
        if(nameWithoutExtension != 'ContactCreationCP'){
            alert('CSV File Name Should be ContactCreationCP');
            return;
           
        }
        this.showSpinner = true;
        const fileReader = new FileReader();
        fileReader.onloadend = () => {
            const fileBody = fileReader.result;
            console.log(fileBody);


            const apexParams = {
                fileName: csvFile.name,
                fileBody
            };
            //saveCsvFile(apexParams);
            this.showSpinner = false;
        };
        fileReader.readAsText(csvFile);
    }


}
   
handleOppUploadFile(event) {
    if (event.detail.files && event.detail.files.length) {
        const csvFile = event.detail.files[0];
        console.log(csvFile.name);
        let filename = csvFile.name;
        let nameWithoutExtension = filename.slice(0, filename.lastIndexOf("."));
        console.log(nameWithoutExtension);
        if(nameWithoutExtension != 'OpportunityCreationCP'){
            alert('CSV File Name Should be OpportunityCreationCP');
            return;
        }
        this.showSpinner = true;
        const fileReader = new FileReader();
        fileReader.onloadend = () => {
            const fileBody = fileReader.result;
            const apexParams = {
                fileName: csvFile.name,
                fileBody
            };
           // saveCsvFile(apexParams);
            this.showSpinner = false;
        };
        fileReader.readAsText(csvFile);
    }


}
handleAccInsertClick(){
    if(this.apexParams.fileName=='' && this.apexParams.fileBody=='' && this.apexParams.headerId==''){
        alert('Upload CSV File to Insert Account');
        return;
    }
    saveCsvFile1({data : JSON.stringify(this.apexParams)})
    .then(result=>{
       console.log(result);
        if(result=='Records Created Successfully'){
          const evt = new ShowToastEvent({
                title: 'Success',
                message: 'Records Created Successfully',
                variant: 'success',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        }else{
            const evt = new ShowToastEvent({
                title:  Error,
                message: result,
                variant: 'error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);


        }
       
    })
    .catch(error=>{
         console.log(error);
    });
     this.apexParams = { fileName:'',fileBody:'',headerId:''};
      this.isButtonDisabled = false;
      this.fileName = '';  
     this.fileContent = '';
     this.showPreview=false;
     this.data=[];
    this.columns=[];
     this.checkSubmit=true;
      this.showPreviewButton=true;
     this.showCancelButton=true;
   
}
handleCancelClick(){
    this.apexParams = { fileName:'',fileBody:'',headerId:''};
    this.isButtonDisabled = false;
    this.fileName = '';  
    this.fileContent = '';
    this.data=[];
    this.columns=[];
    this.showPreview=false;
     this.checkSubmit=true;
     this.showCancelButton=true;
     this.showPreviewButton=true;

}
handlePreviewClick(){
     this.showModal=true;
}
handleCloseModal(){
    this.showModal=false;
}
  parseCsv(csv) {
    
    console.log('parse method');
       const lines = csv.split(/\r\n|\n/);
        console.log("lines = "+JSON.stringify(lines));
        const headers = lines[0].split(',');
        console.log("headers = "+JSON.stringify(headers));
       this.columns = headers.map((header) => {
          return { label: header, fieldName: header };
        });
        console.log("this.columns = "+JSON.stringify(this.columns));
        const data = [];
        lines.forEach((line, i) => {
          if (i === 0) return;
          const obj = {};
          const currentline = line.split(',');
          for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
          }
          data.push(obj);
        });
        console.log("data = "+JSON.stringify(data));
        this.data = data;
        this.showPreview=true;
        this.checkSubmit=false;
        this.showCancelButton=false;
         this.showPreviewButton=false;
      }
 

}