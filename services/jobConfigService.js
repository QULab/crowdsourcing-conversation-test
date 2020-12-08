const JobConfig = require("../models/JobConfig");

exports.getJobConfig = async function getJobConfig(query, page, limit) {

    try {
        console.log("query", query);
        let jobConfig = await JobConfig.find(query).sort({ timestamp: 'asc' })
        return jobConfig;
    } catch (e) {
        // Log Errors
        console.error(e);
        throw Error('Error while getting config', e);
        
    }
}

exports.createJobConfig = async function createJobConfig(query) {
    try {
        console.log("query", query);
        let id = await create({
            
        });
        return id;
    } catch (e) {
        // Log Errors
        throw Error('Error while creating config', e)
    }
}