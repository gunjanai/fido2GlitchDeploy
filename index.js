const { Fido2Lib } = require("fido2-lib");
const express = require('express')
const cors = require('cors')
const bodyparser = require('body-parser')
const base64url = require('base64url');
const generateDBConnection = require('./src/external/dbConn')
const UserSchema = require('./models/userMetadata')
const mongoose = require('mongoose')
const fs = require('fs')
const https = require('https')

const app = express()
app.use(cors())
app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())
app.use(bodyparser.raw({type: 'application/octet-stream'}))

// const httpsOptions = {
//     key: fs.readFileSync("./config/cert.key"),
//     cert: fs.readFileSync("./config/cert.crt"),
//   };

mongoose.connect("mongodb+srv://gunjan:7999797002@passwordlessauth.ukm2zte.mongodb.net/passwordlessUserDatabase?retryWrites=true&w=majority")
    const connection = mongoose.connection
    connection.on('open', () => {
        console.log('connected to mongodb')
    })

var credOptions = new Fido2Lib({
    challengeSize: 128,
    rpId: "showy-eggplant-reason.glitch.me",
    rpName: "dummy server",
    attestation: "none",
    cryptoParams: [-7, -257],
    authenticatorAttachment: "cross-platform",
    authenticatorRequireResidentKey: true,
    authenticatorUserVerification: "required",
    timeout: 600000
})

const changeArrayBufferToArray = (arrayBufferObj) => {
    return Array.from(new Uint8Array(arrayBufferObj))
}

var challenge;
// var publicKey;
// var counter;

// var userID = '123'

const insertRegisterDataInDB = async (counter, publicKey, userID) => {
    const userData = {
        counter: counter,
        publicKey: publicKey,
    }
    let updatedAndInsertedUserDataInDB = await UserSchema.findOneAndUpdate({_id: "1"}, userData)
}

const fetchUserDataFromDB = async () => {
    const fetchedResponseFromDB = await UserSchema.find({_id: '1'})
    return fetchedResponseFromDB
}

app.post('/requestGetMakeCredentialOptions', async (req, res) => {
    const userDataFromDB = await fetchUserDataFromDB()
    const fetchedUserIDFromDB = await userDataFromDB[0].userID
    const registrationOptions = await credOptions.attestationOptions()
    registrationOptions.user = {}
    registrationOptions.user.name = 'gunjan'
    registrationOptions.user.displayName = 'gunjan'
    registrationOptions.user.id = [1, 2, 3]
    challenge = registrationOptions.challenge

    //challenge conversion for checking
    // const typedChallenge = new Uint8Array(challenge)
    // const base64Challenge = [...typedChallenge]
    // console.log('decode challenge --------> ', base64Challenge)
    // console.log('decode challenge --------> ', challenge)
    registrationOptions.challenge = changeArrayBufferToArray(registrationOptions.challenge)
    res.send(registrationOptions)
})

function arrayBufferToBase64( buffer ) {
	var binary = '';
	var bytes = new Uint8Array( buffer );
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode( bytes[ i ] );
	}
	return btoa( binary );
}

app.post('/verifyRegisterCredentials', async (req, res) => {

    console.log("challenge ", challenge)
    
    const credentialsToVerify = req.body 
    //challenge conversion for checking
    const typedChallenge = new Uint8Array(challenge)
    const base64Challenge = [...typedChallenge]
    console.log('decode challenge --------> ', base64Challenge)

    //challenge base64 conversion
    // const b64 = Buffer.from(challenge).toString('base64');
    // console.log('b64 ---> ', b64)

    // const challengeBase64 =  arrayBufferToBase64(challenge)


    var attestationExpectations = {
     challenge: challenge,
     origin: 'android:apk-key-hash:gxWojOh4vPz-zVgc2a2fjlyXc57ybdGjdPZm_hC2ado',
    //  origin: 'http://localhost:3000',
     factor: "either"
    };

    console.log('attestationExpectations-----> ', attestationExpectations)
      var verifyJson = {}
      verifyJson.response ={}
    //   verifyJson.rawId = new Uint8Array(credentialsToVerify.rawId).buffer
    //   verifyJson.response.attestationObject = new Uint8Array(credentialsToVerify.response.attestationObject).buffer
    //   verifyJson.response.clientDataJSON = new Uint8Array(credentialsToVerify.response.clientDataJSON).buffer
    verifyJson.rawId = new Uint8Array(credentialsToVerify.nameValuePairs.rawId).buffer
    verifyJson.response.attestationObject = new Uint8Array(credentialsToVerify.nameValuePairs.response.nameValuePairs.attestationObject).buffer
    verifyJson.response.clientDataJSON = new Uint8Array(credentialsToVerify.nameValuePairs.response.nameValuePairs.clientDataJSON).buffer
    // verifyJson.response.clientDataJSON = credentialsToVerify.nameValuePairs.response.nameValuePairs.clientDataJSON.replace(/\n/g, '')

    // to decode client data json
    // const arrayBuffer = new Uint8Array(credentialsToVerify.nameValuePairs.rawId).buffer
    // const utf8Decoder = new TextDecoder('utf-8');
    // const decodedClientData = JSON.parse(utf8Decoder.decode(arrayBuffer))
    // console.log('decode rawID --------> ', decodedClientData)
   

    
    try{
     var regResult = await credOptions.attestationResult(verifyJson, attestationExpectations)
     console.log('regResult ------> ', regResult)
     res.status(200).end(JSON.stringify({'isRegistrationSuccessful': true}))
    }catch(error){
     console.log(error)
     res.status(401).end(JSON.stringify({'isRegistrationSuccessful': false}))
    }
    publicKey = regResult.authnrData.get("credentialPublicKeyPem")
    counter = regResult.authnrData.get("counter")
    insertRegisterDataInDB(counter, publicKey)
      })

app.post('/requestGetAuthenticateCredentialOptions', async (req, res) => {
    const authOptions = await credOptions.assertionOptions()
    challenge = authOptions.challenge
    authOptions.challenge = changeArrayBufferToArray(authOptions.challenge)
    res.send(authOptions)
})

app.post('/verifyauthcredentials', async (req, res) => {
    const credentialsToVerify = req.body

    const userDataFromDB = await fetchUserDataFromDB()
    const fetchedPublicKeyFromDB = await userDataFromDB[0].publicKey
    const fetchedCounterFromDB = await userDataFromDB[0].counter
    const fetchedUserIDFromDB = await userDataFromDB[0].userID
    const assertionExpectations = {
        challenge: challenge,
        origin: "http://localhost:3000",
        factor: "either",
        publicKey: fetchedPublicKeyFromDB,
        prevCounter: parseInt(fetchedCounterFromDB),
        userHandle: base64url(fetchedUserIDFromDB)
    }
    
    credentialsToVerify.rawId = new Uint8Array(credentialsToVerify.rawId).buffer
    credentialsToVerify.response.authenticatorData = new Uint8Array(credentialsToVerify.response.authenticatorData).buffer
    credentialsToVerify.response.clientDataJSON = new Uint8Array(credentialsToVerify.response.clientDataJSON).buffer
    credentialsToVerify.response.signature = new Uint8Array(credentialsToVerify.response.signature).buffer
    credentialsToVerify.response.userHandle = new Uint8Array(credentialsToVerify.response.userHandle).buffer

    try{
        var authnResult = await credOptions.assertionResult(credentialsToVerify, assertionExpectations); // will throw on error
        console.log('authnResult ------> ', authnResult)
        res.status(200).send('Login Successful')
    }catch(error){
        console.log(error)
        res.status(401).send(error)
    }
    
})

// https.createServer(httpsOptions, app).listen(8080, () => {
//     console.log(`HTTPS server started on port 8080`);
//   });


app.listen(8000, () => {
    console.log('server is listening to port 8000')
})