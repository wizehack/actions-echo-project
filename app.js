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
            let request = require('request');
            let postBody = {"query": rawInput};
            let inputPrompt;
            request.post(
                    '',
                    {'query': rawInput},
                    function (error, response, postBody){
                        if(!error && response.statusCode == 200) {
                            let body = response.getBody();
                            inputPrompt = assistant.buildInputPrompt(false, body.speech,
                                    ['I didn\'t hear', 'Are you there?', 'Please say whatever you want.']);
                        
                        } else {
                            inputPrompt = assistant.buildInputPrompt(false, rawInput,
                                    ['I didn\'t hear', 'Are you there?', 'Please say whatever you want.']);
                        }
                    }
                    );
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
