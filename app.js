// Copyright 2016, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START app]
'use strict';

process.env.DEBUG = 'actions-on-google:*';

let ActionsSdkAssistant = require('actions-on-google').ActionsSdkAssistant;
let express = require('express');
let bodyParser = require('body-parser');

let app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({type: 'application/json'}));

app.post('/', function (request, response) {
    console.log('handle post');
    const assistant = new ActionsSdkAssistant({request: request, response: response});

    console.log('request body');
    console.log(request.body);
    function mainIntent (assistant) {
        console.log('mainIntent');
        let inputPrompt = assistant.buildInputPrompt(true, '<speak>Hi! <break time="1"/> ' +
                'I can reply what you say</speak>',
                ['I didn\'t hear', 'Are you there?', 'Please say whatever you want.']);
        assistant.ask(inputPrompt);
    }

    function rawInput (assistant) {
        let rawInput = assistant.getRawInput();
        console.log('rawInput');

        if (rawInput === 'bye') {
            assistant.tell('Goodbye!');
        } else {
            /*
             * send rawInput to webhook server;
             */
            let httpRequest = require('request');
            let query = request.body;

            // set the header
            let headers = {'user-Agent': 'Mozila Agent/0.0.1'}

            // configure the request
            let options = {
                url: 'http://52.39.36.22:8000/',
                method: 'POST',
                headers: headers,
                form: query 
            }

            let inputPrompt;

            console.log('request to server');
            httpRequest(options, function(error,httpResponse, body) {
                if(!error && httpResponse.statusCode == 200) {
                    console.log('response body');
                    console.log(body);
                    inputPrompt = assistant.buildInputPrompt(false,"You said" + rawInput,
                            ['I didn\'t hear', 'Are you there?', 'Please say whatever you want.']);
                } else {
                    console.log('response code');
                    console.log(httpResponse.statusCode)
                    inputPrompt = assistant.buildInputPrompt(false, rawInput,
                            ['I didn\'t hear', 'Are you there?', 'Please say whatever you want.']);
                }

            });

            assistant.ask(inputPrompt);
        }
    }

    let actionMap = new Map();
    actionMap.set(assistant.StandardIntents.MAIN, mainIntent);
    actionMap.set(assistant.StandardIntents.TEXT, rawInput);

    assistant.handleRequest(actionMap);
});

// Start the server
let server = app.listen(app.get('port'), function () {
    console.log('App listening on port %s', server.address().port);
    console.log('Press Ctrl+C to quit.');
});
// [END app]
