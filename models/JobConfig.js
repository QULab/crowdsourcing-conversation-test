const mongoose = require('mongoose');

const schema = mongoose.Schema;

let JobConfigSchema = new schema({
    study_name: String,
    number_of_session_per_condition: Number,
    scenario: String,
    instruction_html: String,
    rating_scale_html: String,
    html_party_caller: String,
    condition: [
        {
            condition_name: String,
            condition_id: Number,
            configuration_ids: [Number]
        }
    ],
    config_details: [
        {
            config_id: Number,
            condition_type: String,
            noise_file: String,
            SNR_dB: String,
            delay_time_sec: Number,
            probability: Number,
            burst_ratio: Number,
            burst_ratio_pattern: String,
            attenuation: Number,
        }
    ]
},{ collection: "job_config", timestamps: true });

const JobConfig = mongoose.model("JobConfig", JobConfigSchema);
module.exports = JobConfig;