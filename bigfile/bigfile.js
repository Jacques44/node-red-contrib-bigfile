/**
 * Copyright 2013, 2015 IBM Corp.
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
 *
 * Original and good work by IBM
 * "Big Nodes" mods by Jacques W
 *
 * /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
 *
 *  Big Nodes principles:
 *
 *  #1 can handle big data
 *  #2 send start/end messages
 *  #3 tell what they are doing
 *
 *  Any issues? https://github.com/Jacques44
 *
 * /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
 *
 **/

module.exports = function(RED) {
    "use strict";
    var fs = require("fs-extra");
    var os = require("os");
    var stream = require('stream');
    var domain = require('domain');
    var filesize = require('filesize');

    function BigFileNode(n) {
        RED.nodes.createNode(this,n);
        this.filename = n.filename;
        this.appendNewline = n.appendNewline;
        this.overwriteFile = n.overwriteFile.toString();
        this.createDir = n.createDir || false;
        var node = this;

        this.on("input",function(msg) {
            var filename = node.filename || msg.filename || "";
            if (!node.filename) {
                node.status({fill:"grey",shape:"dot",text:filename});
            }
            if (filename === "") {
                node.warn(RED._("file.errors.nofilename"));
            } else if (msg.hasOwnProperty("payload") && (typeof msg.payload !== "undefined")) {
                var data = msg.payload;
                if ((typeof data === "object") && (!Buffer.isBuffer(data))) {
                    data = JSON.stringify(data);
                }
                if (typeof data === "boolean") { data = data.toString(); }
                if (typeof data === "number") { data = data.toString(); }
                if ((this.appendNewline) && (!Buffer.isBuffer(data))) { data += os.EOL; }
                data = new Buffer(data);
                if (this.overwriteFile === "true") {
                    // using "binary" not {encoding:"binary"} to be 0.8 compatible for a while
                    fs.writeFile(filename, data, "binary", function (err) {
                    //fs.writeFile(filename, data, {encoding:"binary"}, function (err) {
                        if (err) {
                            if ((err.code === "ENOENT") && node.createDir) {
                                fs.ensureFile(filename, function (err) {
                                    if (err) { node.error(RED._("file.errors.createfail",{error:err.toString()}),msg); }
                                    else {
                                        fs.writeFile(filename, data, "binary", function (err) {
                                            if (err) { node.error(RED._("file.errors.writefail",{error:err.toString()}),msg); }
                                        });
                                    }
                                });
                            }
                            else { node.error(RED._("file.errors.writefail",{error:err.toString()}),msg); }
                        }
                        else if (RED.settings.verbose) { node.log(RED._("file.status.wrotefile",{file:filename})); }
                    });
                }
                else if (this.overwriteFile === "delete") {
                    fs.unlink(filename, function (err) {
                        if (err) { node.error(RED._("file.errors.deletefail",{error:err.toString()}),msg); }
                        else if (RED.settings.verbose) { node.log(RED._("file.status.deletedfile",{file:filename})); }
                    });
                }
                else {
                    // using "binary" not {encoding:"binary"} to be 0.8 compatible for a while longer
                    fs.appendFile(filename, data, "binary", function (err) {
                    //fs.appendFile(filename, data, {encoding:"binary"}, function (err) {
                        if (err) {
                            if ((err.code === "ENOENT") && node.createDir) {
                                fs.ensureFile(filename, function (err) {
                                    if (err) { node.error(RED._("file.errors.createfail",{error:err.toString()}),msg); }
                                    else {
                                        fs.appendFile(filename, data, "binary", function (err) {
                                            if (err) { node.error(RED._("file.errors.appendfail",{error:err.toString()}),msg); }
                                        });
                                    }
                                });
                            }
                            else { node.error(RED._("file.errors.appendfail",{error:err.toString()}),msg); }
                        }
                        else if (RED.settings.verbose) { node.log(RED._("file.status.appendedfile",{file:filename})); }
                    });
                }
            }
        });
    }
    RED.nodes.registerType("bigfile",BigFileNode);


    function BigFileInNode(n) {
        RED.nodes.createNode(this,n);

        this.filename = n.filename;
        this.format = n.format;
        var node = this;
        var options = {};
        if (this.format) {
            options['encoding'] = this.format;
        }

        var bignode = n.bignode || true;
        var buffer = n.buffer || 64;

        this.on("input",function(msg) {

            // Now filename maybe payload because it's a pain to add a function just to rename payload to filename!
            var filename = node.filename || msg.filename || msg.payload || "";
            if (!node.filename) {
                node.status({fill:"grey",shape:"dot",text:filename});
            }
            if (filename === "") {
                node.warn(RED._("file.errors.nofilename"));
            } else {
                msg.filename = filename;

                if (bignode) {

                    // Big Blue nodes principles !

                    var nb = 0;
                    var size = 0;

                    var outer = new stream.Transform({ objectMode: true });
                    outer._transform = function(data, encoding, done) {

                        size += data.length;

                        // #3 big node principle: tell me what you are doing, so far
                        if (++nb % 1 == 0) node.status({fill: "blue", shape: "dot", text: "sending... " + filesize(size) + " so far"});

                        // #1 big node principle: send blocks for big files management
                        node.send({ payload: data });

                        done();
                    }

                    var finished = function() {
                        outer.end();

                        // #2 big node principle: send controls using msg.control messages
                        node.send({ control: { state: "end" } });

                        // #3 big node principle: tell me when you've done the work
                        node.status({fill: "green", shape: "dot", text: "done with " + filesize(size) });
                    }

                    options.bufferSize = buffer * 1024;

                    // Error management using domain
                    var d = domain.create();
                    d.on('error', function(err) {
                        // #3 big node principle: don't be shy, tell me too when something wrong
                        node.status({fill: "red", shape: "dot", text: err.message });
                        node.error(err);
                    });

                    // #2 big node principle: send controls using msg.control messages
                    node.send({ control: { state: "start" } });

                    // Go!
                    d.run(function() {
                        fs.createReadStream(filename, options)
                        .pipe(outer)
                        .on('finish', finished);
                    });

                } else {

                    // Original work by IBM
                    fs.readFile(filename,options,function(err,data) {
                        if (err) {
                            node.error(err,msg);
                            msg.error = err;
                            delete msg.payload;
                        } else {
                            msg.payload = data;
                            delete msg.error;
                        }
                        node.send(msg);
                    });

                }

            }
        });
    }
    RED.nodes.registerType("bigfile in",BigFileInNode);
}
