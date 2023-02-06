'use strict';

//
// schema.js
// Functions for utilizing the VDJServer Schema
//
// VDJServer
// http://vdjserver.org
//
// Copyright (C) 2023 The University of Texas Southwestern Medical Center
//
// Author: Scott Christley <scott.christley@utsouthwestern.edu>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
//

var vdj_schema  = {};
module.exports = vdj_schema;

// Node Libraries
var _ = require('underscore');
var jsonApprover = require('json-approver');
var yaml = require('js-yaml');
var path = require('path');
var fs = require('fs');
var $RefParser = require('json-schema-ref-parser');
var csv = require('csv-parser');

// Boolean value mappings
var true_values = ['True', 'true', 'TRUE', 'T', 't', '1', 1, true];
var false_values = ['False', 'false', 'FALSE', 'F', 'f', '0', 0, false];
var _to_bool_map = function(x) {
    if (true_values.indexOf(x) >= 0) return true;
    if (false_values.indexOf(x) >= 0) return false;
    return null;
};
var _from_bool_map = function(x) {
    if (x == true) return 'T';
    if (x == false) return 'F';
    return '';
};

vdj_schema.Schema = {};
vdj_schema.schemaPromise = async function() {
    // Load schema
    var schemaFile = path.resolve(__dirname, './vdjserver-schema.yaml');
    var doc = yaml.safeLoad(fs.readFileSync(schemaFile));
    if (!doc) {
        var msg = 'Could not load VDJServer schema yaml file.';
        console.error(msg);
        throw new Error(msg);
    }
    // dereference all $ref objects, returns a promise
    var spec = await $RefParser.dereference(doc);
    vdj_schema.Schema['specification'] = spec;
    return spec;
};
vdj_schema.awaitSchema = function() {
    vdj_schema.schemaPromise()
        .then(function(schema) {
            console.log('done') 
        })
        .catch(function(err) {
            console.log(err)
        });
};


//airr.getSchema = function(definition) {
//    return new airr.SchemaDefinition(definition);
//};

vdj_schema.get_schemas = function() {
    if (! vdj_schema.Schema['specification']) return null;

    // remove Info
    let k = Object.keys(vdj_schema.Schema['specification']);
    k.splice(k.indexOf("Info"), 1);
    return k;
}

vdj_schema.tapisName = function(schema_name) {
}

//
// VDJServer SchemaDefinition
//

vdj_schema.SchemaDefinition = function(definition) {
    if (definition == 'Info') {
        throw new Error('Info is an invalid schema definition name');
    }

    console.log('vdj_schema.SchemaDefinition');
    console.log(vdj_schema.Schema);
    console.log(vdj_schema.Schema['specification']);
    this.definition = vdj_schema.Schema['specification'][definition];
    if (! this.definition)
        throw new Error('Schema definition ' + definition + ' cannot be found in the specifications');

    this.info = vdj_schema.Schema['specification']['Info'];
    if (! this.info)
        throw new Error('Info object cannot be found in the specifications');

    this.allOf = this.definition['allOf'];
    this.properties = this.definition['properties'];
    this.required = this.definition['required'];
    if (! this.required) this.required = [];

    this.vdjserver = this.definition['x-vdjserver'];
    if (! this.vdjserver) this.vdjserver = {};

    return this;
}

vdj_schema.SchemaDefinition.prototype.spec = function(field) {
    return this.properties[field];
};

vdj_schema.SchemaDefinition.prototype.type = function(field) {
    var field_spec = this.properties[field];
    if (! field_spec) return null;
    var field_type = field_spec['type'];
    return field_type;
};

vdj_schema.SchemaDefinition.prototype.is_ontology = function(field) {
    var field_spec = this.properties[field];
    if (! field_spec) return false;
    var field_type = field_spec['type'];
    if (field_type != 'object') return false;
    if ((this.properties[field]['x-airr']) && (this.properties[field]['x-airr']['format'] == 'ontology')) return true;

    return false;
};

vdj_schema.SchemaDefinition.prototype.tapis_name = function() {
    return this.vdjserver['tapis_name'];
};

vdj_schema.SchemaDefinition.prototype.to_bool = function(value, validate) {
    if (value == null) return null;

    var bool_value = _to_bool_map(value);
    if (validate && (bool_value == null))
        throw new Error('invalid bool ' + value);
    return bool_value;
};

vdj_schema.SchemaDefinition.prototype.from_bool = function(value, validate) {
    if (value == null) return '';

    var str_value = _from_bool_map(value);
    if (validate && (str_value == null))
        throw new Error('invalid bool ' + value);
    return str_value;
};

vdj_schema.SchemaDefinition.prototype.to_int = function(value, validate) {
    if (value == null) return null;
    if (value == '') return null;

    var int_value = parseInt(value);
    if (isNaN(int_value)) {
        if (validate)
            throw new Error('invalid int ' +  value);
        else
            return null;
    }
    return int_value;
};

vdj_schema.SchemaDefinition.prototype.to_float = function(value, validate) {
    if (value == null) return null;
    if (value == '') return null;

    var float_value = parseFloat(value);
    if (isNaN(float_value)) {
        if (validate)
            throw new Error('invalid float ' +  value);
        else
            return null;
    }
    return float_value;
};

vdj_schema.SchemaDefinition.prototype.map_value = function(map) {
    //console.log('map value: ', map);
    //console.log(this);
    var field_type = this.type(map['header']);
    var field_value = map['value'];
    switch (field_type) {
    case 'boolean':
        field_value = this.to_bool(field_value);
        break;
    case 'integer':
        field_value = this.to_int(field_value);
        break;
    case 'number':
        field_value = this.to_float(field_value);
        break;
    }
    return field_value;
};

vdj_schema.SchemaDefinition.prototype.template = function(schema_name) {
    // Set defaults for each data type
    var type_default = {'boolean': false, 'integer': 0, 'number': 0.0, 'string': '', 'array':[]};

    var _default = function(spec) {
        if (spec['default']) return spec['default'];
        if (spec['nullable']) return null;
        //if (spec['enum']) return spec['enum'][0];
        return type_default[spec['type']];
    };

    var _populate = function(schema, obj) {
        if (schema.allOf) {
            for (const k in schema.allOf)
                _populate(schema['allOf'][k], obj);
            return;
        }
        for (const k in schema.properties) {
            let spec = schema.properties[k];
            // Skip deprecated
            if (spec['x-airr'] && spec['x-airr']['deprecated'])
                continue
            // populate with value
            switch (spec['type']) {
                case 'object': {
                    let new_obj = {};
                    obj[k] = new_obj;
                    _populate(spec, new_obj);
                    break;
                }
                case 'array':
                    if (spec['items'] && spec['items']['type'] == 'object') {
                        let new_obj = {};
                        obj[k] = [ _populate(spec['items'], new_obj) ];
                    } else
                        obj[k] = _default(spec);
                    break;
                default:
                    obj[k] = _default(spec);
            }
        }
    };

    var obj = {};
    _populate(this, obj);
    return (obj);

/*
    # Fetch schema template definition for a $ref string
    def _reference(ref):
        x = ref.split('/')[-1]
        schema = AIRRSchema.get(x, Schema(x))
        return(schema.template())

    # Get default value
    def _default(spec):
        if 'nullable' in spec['x-airr'] and not spec['x-airr']['nullable']:
            if 'enum' in spec:
                return spec['enum'][0]
            else:
                return type_default.get(spec['type'], None)
        else:
            return None

    # Populate empty object
    object = OrderedDict()
    for k, spec in self.properties.items():
        # Skip deprecated
        if 'x-airr' in spec and spec['x-airr'].get('deprecated', False):
            continue

        # Population values
        if '$ref' in spec:
            object[k] = _reference(spec['$ref'])
        elif spec['type'] == 'array':
            if '$ref' in spec['items']:
                object[k] = [_reference(spec['items']['$ref'])]
            else:
                object[k] = []
        elif 'x-airr' in spec:
            object[k] = _default(spec)
        else:
            object[k] = None
*/
}

//
// IIFE to force load the schema
//

//(async () => {
//    return await vdj_schema.schemaPromise();
//})().then(function(res) {
//        let test = new vdj_schema.SchemaDefinition('Project');
//        console.log(JSON.stringify(test));
//        console.log(test.tapis_name());
//        console.log(test.template());
//}).catch(function(error) {
//    console.error(error);
//});
