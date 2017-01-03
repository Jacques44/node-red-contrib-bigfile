# node-red-contrib-bigfile

"Big File" contrib for node-red. Original work by IBM doesn't fit my needs. With big files, multiple blocks are sent making parsing inconsistent. I also needed the file reader to use state of the art libraries
This node is able to manage big files by sending blocks or string  or lines

![alt tag](https://cloud.githubusercontent.com/assets/18165555/14589405/e3ae04e6-04e1-11e6-8591-5b8039a1e6b0.png)

![alt tag](https://cloud.githubusercontent.com/assets/18165555/14588392/dad963a6-04c8-11e6-8539-f9b4afc4cc32.png)

![alt tag](https://cloud.githubusercontent.com/assets/18165555/14588393/e0718708-04c8-11e6-888e-1489222be76e.png)

## Installation
```bash
npm install node-red-contrib-bigfile
```

## Principles for Big Nodes

###1 can handle big data or block mode

  That means, in block mode, not only "one message is a whole file" and able to manage start/end control messages

###2 send start/end messages as well as statuses

  That means it uses a second output to give control states (start/end/running and error) control messages

###3 tell visually what they are doing

  Visual status on the node tells it's ready/running (blue), all is ok and done (green) or in error (red)

## Usage

Big File is an input node for node-red to read big files and send them as blocks, lines or a unique string

It has options offered by fs: (https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options)

- encoding (any of Buffer encoding)
- start (inclusive, starts at 0)
- end (inclusive, starts at 0)
- highWaterMark (buffer size in 1024 bytes, default 64)

It has two options offered by byline: (https://www.npmjs.com/package/byline)

- data format (utf8, latin, hexdec, base64, ucs2 and ascii)
- keep empty lines

## Dependencies

[byline](https://www.npmjs.com/package/byline) simple line-by-line stream reader

[biglib](https://www.npmjs.com/package/node-red-biglib) library for building node-red flows that supports blocks, high volume

## Example flow files

Try pasting in the flow file below that shows the node behaviour 

  ```json
[{"id":"32d46d5e.3da4e2","type":"bigfile reader","z":"9934716e.0ebf","name":"output as blocks","filename":"","flow":"blocks","highWaterMark":"100","encoding":"utf8","format":"utf8","keepEmptyLines":false,"x":342,"y":333,"wires":[["cb687afc.be79a8"],["cb687afc.be79a8"]]},{"id":"aab657.be7fc9a8","type":"inject","z":"9934716e.0ebf","name":"GO","topic":"","payload":"temp.demo.bigfile","payloadType":"str","repeat":"","crontab":"","once":false,"x":155,"y":395,"wires":[["32d46d5e.3da4e2","7c4e7da.cdd9e84","3b3fd636.930b9a"]]},{"id":"85ba149b.c58de8","type":"function","z":"9934716e.0ebf","name":"random line generator","func":"function getRandomArbitrary(min, max) {\n  return Math.random() * (max - min) + min;\n}\n\nfor (n = 0; n < msg.payload; n++) {\n    var line = \"\";\n    for (i = 1; i < getRandomArbitrary(10,50); i++) {\n        line += String.fromCharCode(getRandomArbitrary('A'.charCodeAt(0), 'Z'.charCodeAt(0)))\n    }\n    msg_line = { payload: line }\n    \n    node.send(msg_line);\n}\n","outputs":"1","noerr":0,"x":389.5,"y":213,"wires":[["dba2050c.635d98"]]},{"id":"d77c7d4e.d631b","type":"inject","z":"9934716e.0ebf","name":"10k lines generator","topic":"","payload":"10000","payloadType":"num","repeat":"","crontab":"","once":false,"x":190.5,"y":165,"wires":[["85ba149b.c58de8"]]},{"id":"dba2050c.635d98","type":"file","z":"9934716e.0ebf","name":"","filename":"temp.demo.bigfile","appendNewline":true,"createDir":false,"overwriteFile":"false","x":592,"y":165,"wires":[]},{"id":"45af7987.c3bfe8","type":"debug","z":"9934716e.0ebf","name":"got ... lines","active":true,"console":"false","complete":"payload","x":879,"y":461,"wires":[]},{"id":"3b3fd636.930b9a","type":"bigfile reader","z":"9934716e.0ebf","name":"output as lines","filename":"","flow":"lines","encoding":"utf8","format":"utf8","keepEmptyLines":false,"x":329.5,"y":450,"wires":[["b15cc846.449a18"],["b15cc846.449a18"]]},{"id":"7c4e7da.cdd9e84","type":"bigfile reader","z":"9934716e.0ebf","name":"output as a buffer","filename":"","flow":"buffer","encoding":"utf8","format":"utf8","keepEmptyLines":false,"x":340.5,"y":393,"wires":[["1e9bea01.8e5496"],[]]},{"id":"b15cc846.449a18","type":"function","z":"9934716e.0ebf","name":"line counter","func":"if (msg.payload) {\n    global.lines++;\n}\nif (msg.control && msg.control.state == 'start') {\n    global.lines = 0;\n}\nif (msg.control && msg.control.state == 'end') {\n    node.send({ payload: \"Got \" + global.lines + \" lines\" })\n}\n","outputs":1,"noerr":0,"x":703,"y":461,"wires":[["45af7987.c3bfe8"]]},{"id":"cf466573.c1d7e8","type":"debug","z":"9934716e.0ebf","name":"got a string","active":true,"console":"false","complete":"payload","x":879.5,"y":389,"wires":[]},{"id":"1e9bea01.8e5496","type":"function","z":"9934716e.0ebf","name":"byte counter","func":"node.send({ payload: \"Got a \" + msg.payload.length + \" bytes string!\"})","outputs":1,"noerr":0,"x":647.5,"y":389,"wires":[["cf466573.c1d7e8"]]},{"id":"cb687afc.be79a8","type":"function","z":"9934716e.0ebf","name":"block counter","func":"if (msg.payload) {\n    global.blocks++;\n    global.size += msg.payload.length;\n}\nif (msg.control && msg.control.state == 'start') {\n    global.blocks = global.size = 0;\n}\nif (msg.control && msg.control.state == 'end') {\n    node.send({ payload: \"Got \" + global.blocks + \" blocks for a total of \" + global.size + \" bytes\" })\n}\n","outputs":1,"noerr":0,"x":636.5,"y":333,"wires":[["c12a2c22.95ab8"]]},{"id":"c12a2c22.95ab8","type":"debug","z":"9934716e.0ebf","name":"got ... blocks + bytes","active":true,"console":"false","complete":"payload","x":849.5,"y":333,"wires":[]},{"id":"ae5ebb95.580c38","type":"comment","z":"9934716e.0ebf","name":"First of all, generate a random file","info":"","x":227,"y":127,"wires":[]},{"id":"c35babad.5a4f08","type":"comment","z":"9934716e.0ebf","name":"bigfile usage demo pre-configured","info":"","x":237.5,"y":289,"wires":[]},{"id":"b752cab6.309718","type":"comment","z":"9934716e.0ebf","name":"Big File node example of use","info":"","x":156.5,"y":71,"wires":[]},{"id":"582e2844.ed2138","type":"bigfile reader","z":"9934716e.0ebf","name":"","filename":"","flow":"blocks","encoding":"utf8","format":"utf8","keepEmptyLines":false,"x":537,"y":654,"wires":[[],[]]},{"id":"24fae90d.104766","type":"inject","z":"9934716e.0ebf","name":"GO with an error","topic":"","payload":"","payloadType":"str","repeat":"","crontab":"","once":false,"x":174.5,"y":654,"wires":[["5711e171.e24a3"]]},{"id":"5711e171.e24a3","type":"function","z":"9934716e.0ebf","name":"Non existing file","func":"msg.payload = \"/A/Probably/Non/Existing/File\"\nreturn msg;","outputs":1,"noerr":0,"x":370.5,"y":654,"wires":[["582e2844.ed2138"]]},{"id":"46d6b61d.faacb8","type":"inject","z":"9934716e.0ebf","name":"GO controlled","topic":"","payload":"dummy","payloadType":"str","repeat":"","crontab":"","once":false,"x":167.5,"y":547,"wires":[["1b887c3b.688e34"]]},{"id":"93afd4c7.55cbb8","type":"bigfile reader","z":"9934716e.0ebf","name":"initially as blocks","filename":"","nopayload":true,"flow":"blocks","highWaterMark":"","encoding":"utf8","format":"utf8","keepEmptyLines":false,"x":513.5,"y":550,"wires":[["b15cc846.449a18"],["b15cc846.449a18"]]},{"id":"1b887c3b.688e34","type":"function","z":"9934716e.0ebf","name":"control msg","func":"msg.config = { flow: \"lines\", filename: \"temp.demo.bigfile\" }\nreturn msg;","outputs":1,"noerr":0,"x":328.5,"y":567,"wires":[["93afd4c7.55cbb8"]]},{"id":"b8ad9126.d476","type":"comment","z":"9934716e.0ebf","name":"bigfile usage demo message configured","info":"","x":249.5,"y":511,"wires":[]},{"id":"dfc47488.ac1498","type":"comment","z":"9934716e.0ebf","name":"error example","info":"","x":158.5,"y":614,"wires":[]},{"id":"fc942ae2.196868","type":"debug","z":"9934716e.0ebf","name":"got ... lines","active":true,"console":"false","complete":"payload","x":913.5,"y":551,"wires":[]},{"id":"e3f22c85.52886","type":"function","z":"9934716e.0ebf","name":"line counter","func":"if (msg.payload) {\n    global.lines++;\n}\nif (msg.control && msg.control.state == 'start') {\n    global.lines = 0;\n}\nif (msg.control && msg.control.state == 'end') {\n    node.send({ payload: \"Got \" + global.lines + \" lines\" })\n}\n","outputs":1,"noerr":0,"x":725.5,"y":550,"wires":[["fc942ae2.196868"]]}]
  ```

  ![alt tag](https://cloud.githubusercontent.com/assets/18165555/14589287/9c03d01a-04de-11e6-90dc-7a049079bb76.png)

## Author

  - Jacques W

## License

This code is Open Source under an Apache 2 License.

You may not use this code except in compliance with the License. You may obtain an original copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. Please see the
License for the specific language governing permissions and limitations under the License.

## Feedback and Support

Please report any issues or suggestions via the [Github Issues list for this repository](https://github.com/Jacques44/node-red-contrib-bigfile/issues).

For more information, feedback, or community support see the Node-Red Google groups forum at https://groups.google.com/forum/#!forum/node-red


