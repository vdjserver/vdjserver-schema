'use strict';

//
// vdjserver-schema.js
//
// VDJServer JSON schema objects.
//
// Copyright (C) 2023 UT Southwestern Medical Center
//
// Author: Scott Christley <scott.christley@utsouthwestern.edu>
//

// The I/O file routines are provided with the node edition.

// Node Libraries
var yaml = require('js-yaml');
var path = require('path');
var fs = require('fs');

var vdj_schema = {};
module.exports = vdj_schema;

// we use airr-js to load custom schema
vdj_schema.load_schema = async function() {
    var file = path.resolve(__dirname, './vdjserver-schema.yaml');
    console.log('vdj_schema.load_schema:', file);
    var airr = require('airr-js');
    var spec = await airr.load_custom_schema(vdj_schema, file);

    return Promise.resolve(spec);
};
