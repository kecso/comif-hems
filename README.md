# comif-hems
Implementation of a Common Integrated Framework for Heterogeneous Modeling Services

The framework combines the WebGME modeling framework and extend its vast capabilities with 
the logic programing language FORMULA and the graph queries of Gremlin to provide a complete
package for MDE engineers.

## Installation
- As a first step, the repository has to be cloned/downloaded to the users machine (right now, only windows operating system is supported!).
- Secondly, the ```npm install``` command has to be run.
- For further requirements regarding Webgme, check out its [repository](https://github.com/webgme/webgme).
- Get and install Gremlin console from [here](https://www.apache.org/dyn/closer.lua/tinkerpop/3.3.3/apache-tinkerpop-gremlin-console-3.3.3-bin.zip) (further info can be found [here](http://tinkerpop.apache.org/docs/current/tutorials/the-gremlin-console/)). The gremlin console has to be installed at 'C:\gremlin-console'!!!
- Install the included Formula as instructed [here](https://github.com/kecso/comif-hems/tree/master/externals).
- To start the completed environment just run ```node app.js``` from the main directory of the project.
