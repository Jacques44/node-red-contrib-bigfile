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

    var biglib = require('node-red-biglib');

    function BigFileInNode(config) {

        RED.nodes.createNode(this, config);

        // new instance of biglib for this configuration
        var bignode = new biglib({ config: config, node: this, status: 'filesize', generator: 'filename' });

        // biglib changes the configuration to add some properties
        config = bignode.config();

        this.on('input', function(msg) {

          // if no configuration available from the incoming message, a new one is returned, cloned from default
          msg.config = bignode.new_config(msg.config);  

          if (!config.nopayload) msg.filename = msg.filename || msg.payload;
          bignode.set_generator_property(msg);

          if (!msg.config.filename) throw new Error("No filename given");

          if (msg.config.flow == "blocks") {

            delete msg.config.format;
            return bignode.stream_file_blocks(msg);
          }

          if (msg.config.flow == "buffer") {

            delete msg.config.format;
            return bignode.stream_full_file(msg);
          }     

          if (msg.config.flow == "lines") {

            return bignode.stream_data_lines(msg);
          }

          throw new Error("Unknown flow format: " + config.flow);

        });
    }

    RED.nodes.registerType("bigfile reader",BigFileInNode);
}
