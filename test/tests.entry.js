require("isomorphic-fetch");
Object.assign = require("lodash").assign;
const Enzyme = require("enzyme");
const Adapter = require("enzyme-adapter-react-16");

Enzyme.configure({ adapter: new Adapter() });

window.ga = function() {};
