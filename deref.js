'use strict';

//
// deref.js
// VDJServer JSON schema objects.
// generate a dereferenced version of the spec
//
// Copyright (C) 2023 UT Southwestern Medical Center
//
// Author: Scott Christley <scott.christley@utsouthwestern.edu>
//

// The I/O file routines are provided with the node edition.

// Node Libraries
var yaml = require('js-yaml');
var fs = require('fs');
var path = require('path');
var vdj_schema = require('./vdjserver-schema');

vdj_schema.load_schema().then(function() {
    var outFile = path.resolve(__dirname, './vdjserver-schema-deref.yaml');
    fs.writeFile(outFile, yaml.safeDump(vdj_schema.Schema['specification']), (err) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
    });
}).catch(function(error) {
    console.error(error);
    process.exit(1);
});
