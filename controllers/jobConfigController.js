const jobConfigService = require("../services/jobConfigService");

exports.getJobConfig = async function getJobConfig(req, res, next) {
    try {
        let alerts = await jobConfigService.getJobConfig();
        return res
            .status(200)
            .json({
                status: 200,
                data: alerts,
                message: "Successfully Job Config Retrieved",
            });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}


exports.createJobConfig = async function createJobConfig(req, res, next) {
    let query = req.body;
    try {
        let alerts = await jobConfigService.createJobConfig(query);
        return res
            .status(200)
            .json({
                status: 200,
                data: alerts,
                message: "Successfully created Job config",
            });
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
}
