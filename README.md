#WebRTC based Conversation Test

This system will setup a Conversation Test to assess the speech quality by the test participants. The system is based 
on the WebRTC. 





## Running Locally

Make sure you have [Node.js](http://nodejs.org/) installed.

```sh
git clone https://gitlab.tubit.tu-berlin.de/pavanct/conversation-tests-with-webrtc.git # or clone your own fork
cd conversation-tests-with-webrtc
npm install
npm start
```

Your app should now be running on [localhost:3000](http://localhost:3000/).

### Run using Docker

Make sure you have [Docker](https://docs.docker.com/install/) installed and have permissions to run docker (sudo)

```sh
git clone https://gitlab.tubit.tu-berlin.de/pavanct/conversation-tests-with-webrtc.git # or clone your own fork
cd conversation-tests-with-webrtc
docker build . t "conversation-tests-with-webrtc"
docker run -d -p 3000:3000 conversation-tests-with-webrtc
```


## Test Types
    1. **user2file**: 
    1. **user2user**
## how to:
    
### Configuration of study:
make 

```json
{
    "study_name": "text (use in database so the records are separated)."  
    "number_of_session_per_condition": 10,
    "scenario": "short_conversation test// + future work other scenarios", 
    "condition": [
        {
            "condition_name": "c01_user_2_file",
            "condition_id": 1,             
            "configuration_ids":[1,2],
            "html_party_1": "html_address",
            "html_party_2": "html_address",
            "scale": ["overall_quality"]
        }
        
    ],
    "config_details":[
      { 
        "config_id": 1 ,
        "condition_type": "noise",
        "noise_file": "noise_file_to_use.wav",
        "SNR_dB": 5      
      }, { 
        "config_id": 2 ,
        "condition_type": "delay",       
        "delay_time_sec": 2      
      }, { 
        "config_id": 3 ,
        "condition_type": "packet_lost",       
        "probability": 0.2,
        "burst_ratio" : 1     
      }, { 
        "config_id": 4 ,
        "condition_type": "echo",       
        "delay_time_sec": 1.5,
        "attenuation": 5 
             
      }
       
    
    ] 
    
    
}

```
More details for each config file:

 "condition_type": one of "noise", "delay", "packet_lost", "echo"
 
 "burst_ratio": "how close the packet could be (1: random), higher 4, 5 means packet_lost happen in clusters"


## Contact
Pavan


## License
XXX