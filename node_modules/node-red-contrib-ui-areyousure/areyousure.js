/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
module.exports = function (RED) {
    var ui = undefined;
    function AreYouSure(config) {
        try {
            var node = this;
            if (ui === undefined) {
                ui = RED.require("node-red-dashboard")(RED);
            }

            RED.nodes.createNode(this, config);
            var done = ui.addWidget({
                node: node,
                format: "",
                templateScope: "local",
                emitOnlyNewValues: false,
                forwardInputMessages: false,
                storeFrontEndInputAsState: true,
                group: config.group,
                order: 0,
                width: 0,
                height: -1,
                convertBack: function (value) {
                    return value;
                },
                beforeSend: function (msg, orig) {
                    if (orig) {
                        return orig.msg;
                    }
                },

                //Setup the angular parameters
                initController: function ($scope, events) {
                    $scope.countInterval = undefined;

                    //Delete the generated elements
                    var deleteElement = function () {
                        try {
                            document.getElementById("are-you-sure-dialog").remove();
                            clearInterval($scope.countInterval);
                        } catch (e) { }
                    }

                    //When a message comes on the input and is sent from before emit
                    $scope.$watch("msg", function (msg) {
                        if (!msg) { return; }
                        if (msg.length > 0) { return; }

                        if (!msg.options) { msg.options = {}; }
                        var icon = msg.options.icon || msg.config.icon || "fa fa-exclamation-triangle";
                        var title = msg.options.title || msg.config.title || "Are You Sure?";
                        var description = msg.options.description || msg.config.description || "Are you sure you want to perform this action?";
                        var timeoutSec = parseInt(msg.options.timeoutSec) || parseInt(msg.config.timeoutSec) || 10;
                        var iconColor = msg.options.iconColor || msg.config.iconColor || "orange";
                        var textColor = msg.options.textColor || msg.config.textColor || "white";
                        var backgroundColor = msg.options.backgroundColor || msg.config.backgroundColor || "black";

                        deleteElement();

                        //Add our element
                        var body = document.getElementsByTagName("body")[0];
                        var div = document.createElement("div");
                        div.id = "are-you-sure-dialog";
                        div.style = String.raw`
                            z-index: 5;
                            width: 100vw;
                            height: 100vh;
                            top: 0;
                            left: 0;
                            background-color: ${backgroundColor};
                            color: white;
                            display: none;
                            opacity: 0;
                            transition: opacity 0.5s;
                        `;

                        var center = document.createElement("center");
                        center.innerHTML = String.raw`
                            <h1 style="font-size: 5vw; margin: 0; color: ${iconColor}"><i class="${icon}"></i></h1>
                            <h1 style="color: ${textColor}">${title}</h1>
                            <h2 style="color: ${textColor}">${description}</h2>
                            <p style="color: ${textColor}">Will automatically select no in <strong id='areYouSureCountdownSec'>${timeoutSec}</strong> seconds</p>
                            <div style="height: 3vh"></div>
                        `;

                        var buttonStyle = String.raw`
                            width: 30vw;
                            margin: 10px;
                            height: 15vh;
                            font-size: 1.2em;
                        `;

                        var yesButton = document.createElement("button");
                        yesButton.style.cssText = buttonStyle;
                        yesButton.innerHTML = "<i class='fa fa-check' style='color: green'></i> Yes";
                        yesButton.onclick = function () { $scope.send([msg, undefined]); deleteElement(); };
                        var noButton = document.createElement("button");
                        noButton.style.cssText = buttonStyle;
                        noButton.innerHTML = "<i class='fa fa-times' style='color: red'></i> No";
                        noButton.onclick = function () { $scope.send([undefined, msg]); deleteElement(); };

                        center.appendChild(yesButton);
                        center.appendChild(noButton);
                        div.appendChild(center);
                        body.appendChild(div);

                        //Handle countdown
                        $scope.countInterval = setInterval(function () {
                            var count = parseInt(document.getElementById("areYouSureCountdownSec").innerHTML);
                            document.getElementById("areYouSureCountdownSec").innerHTML = count - 1;
                            if (count <= 0) {
                                $scope.send([undefined, msg]);
                                deleteElement();
                            }
                        }, 1000);

                        //Show dialog
                        document.getElementById("are-you-sure-dialog").style.display = "block";
                        setTimeout(function () { document.getElementById("are-you-sure-dialog").style.opacity = 1; }, 100);
                    });

                    deleteElement();
                },

                beforeEmit: function (msg, value) {
                    msg.config = config;
                    return { msg };
                }
            });

        }
        catch (e) {
            console.log(e);
        }
        node.on("close", done);
    }
    RED.nodes.registerType('ui_are_you_sure', AreYouSure);
};