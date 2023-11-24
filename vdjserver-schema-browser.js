'use strict';

//
// vdjserver-schema-browser.js
//
// VDJServer JSON schema objects.
// browser edition
//
// Copyright (C) 2023 UT Southwestern Medical Center
//
// Author: Scott Christley <scott.christley@utsouthwestern.edu>
//

// The I/O file routines are not provided with the browser edition.

// For webpack, we are utilizing the browser entry in package.json
// Are we assuming Webpack?

export var vdj_schema = {};

// the specification, resolved by webpack
import VDJSchema from 'vdj-schema';
// schema functions
var schema = require('airr-js/schema')(vdj_schema, VDJSchema);
