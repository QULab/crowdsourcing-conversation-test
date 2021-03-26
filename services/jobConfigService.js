const JobConfig = require("../models/JobConfig");

exports.getJobConfig = async function getJobConfig(query, page, limit) {

    try {
        console.log("[GET]     /jobConfig",query,page,limit);
        let jobConfig = await JobConfig.find(query).sort({ timestamp: 'asc' })
        return jobConfig;
    } catch (e) {
        // Log Errors
        console.error(e);
        throw Error('Error while getting config', e);
        
    }
}

exports.createJobConfig = async function createJobConfig(data) {
    try {
        console.log("[POST]    /JobConfig");
        let job = new JobConfig(data);
        job.save();
        // return id;
    } catch (e) {
        // Log Errors
        throw Error('Error while creating config', e)
    }
}

exports.deleteJobConfig = async function deleteJobConfig(data){
    try{
        console.log("[DELETE]  /jobConfig");
        let alerts
      
            console.log("Deleting One Entry")
            let jobConfig = await JobConfig.deleteMany(data,function(err,result){
                if(err){
                    console.log(err);
                    alerts = err;
                }
                //console.log("Answer from DB:" ,result);
                alerts =  result;
            })
            return alerts;
         
    }catch(e){
        throw Error('Error while deleting config', e)
    }
}


