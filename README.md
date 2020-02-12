# master-thesis-conversation-tests-with-webrtc

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