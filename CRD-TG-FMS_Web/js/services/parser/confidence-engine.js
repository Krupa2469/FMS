/******************************************************************
 * confidence-engine.js
 * Enterprise Parser V2
 * Confidence Engine
 ******************************************************************/

console.log("Confidence Engine Loaded");

/*---------------------------------------------------------------
    Calculate Confidence
---------------------------------------------------------------*/
function calculateConfidence(fields) {

    const confidence = {};

    confidence.grievanceNumber =
        scoreRegistration(fields.grievanceNumber);

    confidence.dateReceived =
        scoreDate(fields.dateReceived);

    confidence.complainantName =
        scoreName(fields.complainantName);

    confidence.mobile =
        scoreMobile(fields.mobile);

    confidence.email =
        scoreEmail(fields.email);

    confidence.address =
        scoreAddress(fields.address);

    confidence.district =
        scoreDistrict(fields.district);

    confidence.subject =
        scoreSubject(fields.subject);

    confidence.description =
        scoreDescription(
            fields.grievanceDescription
        );

    confidence.overall =
        calculateOverall(confidence);

    return confidence;

}

/*---------------------------------------------------------------*/

function scoreRegistration(value){

    if(!value) return 0;

    if(/(PMOPG|DORLD|DARPG)/i.test(value))
        return 100;

    return 70;

}

/*---------------------------------------------------------------*/

function scoreDate(value){

    if(!value) return 0;

    return /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? 100 : 50;

}

/*---------------------------------------------------------------*/

function scoreName(value){

    if(!value) return 0;

    if(value.length>5)
        return 100;

    return 60;

}

/*---------------------------------------------------------------*/

function scoreMobile(value){

    if(!value) return 0;

    return /^[6-9]\d{9}$/.test(value)
        ?100:40;

}

/*---------------------------------------------------------------*/

function scoreEmail(value){

    if(!value) return 80;

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ?100:40;

}

/*---------------------------------------------------------------*/

function scoreAddress(value){

    if(!value) return 30;

    if(value.length>20)
        return 100;

    return 60;

}

/*---------------------------------------------------------------*/

function scoreDistrict(value){

    if(!value) return 40;

    return 100;

}

/*---------------------------------------------------------------*/

function scoreSubject(value){

    if(!value) return 20;

    if(value.length>10)
        return 100;

    return 60;

}

/*---------------------------------------------------------------*/

function scoreDescription(value){

    if(!value) return 0;

    if(value.length>100)
        return 100;

    if(value.length>50)
        return 80;

    return 50;

}

/*---------------------------------------------------------------*/

function calculateOverall(scores){

    let total=0;
    let count=0;

    Object.entries(scores).forEach(([key,value])=>{

        if(key==="overall")
            return;

        total+=value;
        count++;

    });

    return Math.round(total/count);

}

/*---------------------------------------------------------------*/

window.calculateConfidence=
calculateConfidence;